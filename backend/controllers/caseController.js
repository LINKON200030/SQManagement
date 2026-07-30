const Case = require('../models/Case');

const list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const items = await Case.find(filter).sort({ caseSeq: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { customerName, customerContact, title, issues, createdBy } = req.body;

    // Auto-generate the next case number (CASE-0001, CASE-0002, ...).
    // Retry on duplicate key in case two cases are raised at the same moment.
    let item = null;
    for (let attempt = 0; attempt < 3 && !item; attempt++) {
      const latest = await Case.findOne().sort({ caseSeq: -1 }).select('caseSeq');
      const nextSeq = (latest?.caseSeq || 0) + 1;
      try {
        item = await Case.create({
          caseSeq: nextSeq,
          caseNumber: `CASE-${String(nextSeq).padStart(4, '0')}`,
          customerName,
          customerContact,
          title,
          issues,
          createdBy,
        });
      } catch (err) {
        if (err.code !== 11000) throw err;
      }
    }
    if (!item) throw new Error('Could not allocate a case number, please try again');
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const updates = { ...req.body };
    // Case number and sequence are system-assigned and never editable.
    delete updates.caseSeq;
    delete updates.caseNumber;

    if (updates.status === 'Solved') {
      updates.solvedAt = new Date();
    } else if (updates.status === 'In Processing') {
      updates.solvedAt = null;
    }

    const item = await Case.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ message: 'Case not found' });
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const item = await Case.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Case not found' });
    res.json({ message: 'Case deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { list, create, update, remove };
