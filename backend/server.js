const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const orderRoutes = require('./routes/orderRoutes');
const customerRoutes = require('./routes/customerRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const monthlyReportRoutes = require('./routes/monthlyReportRoutes');
const knowledgeRoutes = require('./routes/knowledgeRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const stripeWebhookRoutes = require('./routes/stripeWebhookRoutes');
const websiteBookingRoutes = require('./routes/websiteBookingRoutes');

dotenv.config();

const app = express();

connectDB();

app.use(cors());

// Stripe webhook MUST be mounted before express.json() — it needs the raw body
// for signature verification. The route applies its own express.raw() parser.
app.use('/api/webhooks/stripe', stripeWebhookRoutes);

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'SQManagement API is running' });
});

app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/monthly-reports', monthlyReportRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/bookings/website', websiteBookingRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
