const User = require("../models/User");

// Simple helper to compute rough distance between two lat/lng pairs (km)
const haversineKm = (a, b) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // earth radius km
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const hav =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));
  return R * c;
};

exports.getMe = async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select("-password");
    if (!me) {
      return res.status(404).json({ message: "Donor not found" });
    }
    res.json(me);
  } catch (err) {
    console.error("Failed to fetch donor profile", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const allowed = ["name", "phone", "bloodGroup", "location"];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (updates.location) {
      const { lat, lng, label } = updates.location || {};
      if (typeof lat !== "number" || Number.isNaN(lat) || typeof lng !== "number" || Number.isNaN(lng)) {
        return res.status(400).json({ message: "location.lat and location.lng must be numbers" });
      }
      updates.location = { lat, lng };
      if (label && typeof label === "string") {
        updates.location.label = label;
      }
    }

    const updated = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      select: "-password",
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Donor not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Failed to update donor profile", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getNearby = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radiusKm = req.query.km ? parseFloat(req.query.km) : 25;

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: "lat and lng query parameters are required" });
    }

    const origin = { lat, lng };

    const bloodGroupFilter = (() => {
      const { bg, rh } = req.query;
      if (!bg) return undefined;
      if (rh === "+" || rh === "-") return `${bg}${rh}`;
      return bg;
    })();

    const query = {
      role: "donor",
      isVerified: true,
      "location.lat": { $ne: null },
      "location.lng": { $ne: null },
    };

    if (bloodGroupFilter) {
      query.bloodGroup = bloodGroupFilter;
    }

    const donors = await User.find(query).select("name email phone bloodGroup location");

    const withinRadius = donors
      .map((donor) => {
        const distanceKm = haversineKm(origin, donor.location);
        return {
          id: donor._id,
          name: donor.name,
          email: donor.email,
          phone: donor.phone,
          bloodGroup: donor.bloodGroup,
          location: donor.location,
          distanceKm,
        };
      })
      .filter((record) => !Number.isNaN(record.distanceKm) && record.distanceKm <= (radiusKm || 25))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.json(withinRadius);
  } catch (err) {
    console.error("Failed to fetch nearby donors", err);
    res.status(500).json({ message: "Server error" });
  }
};
