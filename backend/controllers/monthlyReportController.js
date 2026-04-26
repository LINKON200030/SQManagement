const MonthlyReport = require('../models/MonthlyReport');

const buildKey = (year, month) =>
  `${year}-${String(month).padStart(2, '0')}`;

const listReports = async (req, res) => {
  try {
    const reports = await MonthlyReport.find()
      .sort({ year: -1, month: -1 })
      .select('monthKey year month shopTillIncome insideTillIncome updatedAt');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReport = async (req, res) => {
  try {
    const { year, month } = req.params;
    const monthKey = buildKey(year, month);
    let report = await MonthlyReport.findOne({ monthKey });
    if (!report) {
      report = {
        monthKey,
        year: Number(year),
        month: Number(month),
        shopTillIncome: 0,
        insideTillIncome: 0,
        categoryIncome: { stationary: 0, photolab: 0, photocopies: 0, lottery: 0 },
        expenses: [],
      };
    }
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const upsertReport = async (req, res) => {
  try {
    const { year, month } = req.params;
    const yr = Number(year);
    const mo = Number(month);
    if (!yr || !mo || mo < 1 || mo > 12) {
      return res.status(400).json({ message: 'Invalid year or month' });
    }
    const monthKey = buildKey(yr, mo);
    const payload = {
      ...req.body,
      monthKey,
      year: yr,
      month: mo,
    };
    const report = await MonthlyReport.findOneAndUpdate(
      { monthKey },
      { $set: payload },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json(report);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteReport = async (req, res) => {
  try {
    const { year, month } = req.params;
    const monthKey = buildKey(year, month);
    const result = await MonthlyReport.findOneAndDelete({ monthKey });
    if (!result) return res.status(404).json({ message: 'Report not found' });
    res.json({ message: 'Report deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { listReports, getReport, upsertReport, deleteReport };
