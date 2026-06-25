const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const orderRoutes = require('./routes/orderRoutes');
const customerRoutes = require('./routes/customerRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const monthlyReportRoutes = require('./routes/monthlyReportRoutes');
const knowledgeRoutes = require('./routes/knowledgeRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const websiteBookingRoutes = require('./routes/websiteBookingRoutes');
const stripeWebhookRoutes = require('./routes/stripeWebhookRoutes');
const galleryAdminRoutes = require('./routes/galleryAdminRoutes');
const galleryPublicRoutes = require('./routes/galleryPublicRoutes');

dotenv.config();

const app = express();

connectDB();

app.use(cors());

app.use('/api/stripe', stripeWebhookRoutes);

app.use(cookieParser());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'SQManagement API is running' });
});

// Public client galleries. Token-gated, walled off from admin SPA.
// Note: routes here are at /g/* (NOT /api/*) so they can be served as HTML
// without colliding with the React app and without leaking admin data.
app.use('/g', galleryPublicRoutes);

app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/monthly-reports', monthlyReportRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/bookings/website', websiteBookingRoutes);
app.use('/api/admin', galleryAdminRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
