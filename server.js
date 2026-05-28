const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/self_mba_tracker";

const entrySchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    week: { type: Number, required: true, min: 1, max: 4 },
    focus: { type: String, required: true, trim: true },
    source: { type: String, trim: true, default: "" },
    minutes: { type: Number, required: true, min: 0 },
    completed: { type: Boolean, default: false },
    notes: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

const Entry = mongoose.model("Entry", entrySchema);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/entries", async (req, res) => {
  const entries = await Entry.find().sort({ date: -1, createdAt: -1 }).lean();
  res.json(entries);
});

app.post("/api/entries", async (req, res) => {
  try {
    const entry = await Entry.create({
      date: req.body.date,
      month: Number(req.body.month),
      week: Number(req.body.week),
      focus: req.body.focus,
      source: req.body.source,
      minutes: Number(req.body.minutes),
      completed: Boolean(req.body.completed),
      notes: req.body.notes
    });

    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.patch("/api/entries/:id", async (req, res) => {
  try {
    const entry = await Entry.findByIdAndUpdate(
      req.params.id,
      { completed: Boolean(req.body.completed) },
      { new: true, runValidators: true }
    );

    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    res.json(entry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete("/api/entries/:id", async (req, res) => {
  try {
    const entry = await Entry.findByIdAndDelete(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

async function start() {
  try {
    await mongoose.connect(mongoUri);
    app.listen(port, () => {
      console.log(`Self-MBA tracker running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start app:", error.message);
    process.exit(1);
  }
}

start();
