const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Order = require('./models/Order');
const Customer = require('./models/Customer');

dotenv.config();

const d = (hoursFromNow) => new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);

const sampleOrders = [
  {
    customerName: 'Rahman Family',
    customerPhone: '+880 1711-110001',
    customerEmail: 'rahman.family@example.com',
    title: 'Wedding Photography – Rahman Family',
    description: 'Full day wedding coverage, 2 photographers. Location: Bashundhara Residential Area.',
    price: 25000,
    priceStatus: 'Paid',
    orderBy: 'Linkon',
    assignedTo: 'Raki',
    tag: 'Emergency',
    dueDate: d(2),
    status: 'In Processing',
  },
  {
    customerName: 'TechCorp BD',
    customerPhone: '+880 1711-110002',
    customerEmail: 'hr@techcorp.bd',
    title: 'Corporate Headshots – TechCorp BD',
    description: 'Studio headshots for 15 employees. Include retouching and color grading.',
    price: 12000,
    priceStatus: 'Unpaid',
    orderBy: 'Babu',
    assignedTo: 'Linkon',
    tag: 'Flexible',
    dueDate: d(5),
    status: 'In Processing',
  },
  {
    customerName: 'Hasan & Nadia',
    customerPhone: '+880 1711-110003',
    customerEmail: 'hasan.nadia@example.com',
    title: 'Engagement Shoot – Hasan & Nadia',
    description: 'Outdoor couple shoot at Hatirjheel. Golden hour session, 2 hours.',
    price: 7500,
    priceStatus: 'Paid',
    orderBy: 'Raki',
    assignedTo: 'Balli',
    tag: 'Flexible',
    dueDate: d(3),
    status: 'In Processing',
  },
  {
    customerName: 'Fashion Boutique',
    customerPhone: '+880 1711-110004',
    customerEmail: 'orders@fashionboutique.com',
    title: 'Product Shoot – Fashion Boutique',
    description: 'Catalog shoot for new collection. 50+ items, white background, same-day delivery.',
    price: 8500,
    priceStatus: 'Paid',
    orderBy: 'Johana',
    assignedTo: 'Babu',
    tag: 'Flexible',
    dueDate: d(28),
    status: 'In Processing',
  },
  {
    customerName: 'Karim Family',
    customerPhone: '+880 1711-110005',
    customerEmail: 'karim@example.com',
    title: 'Birthday Portraits – Karim Family',
    description: '1-hour studio session, family of 5. Balloon setup included.',
    price: 5000,
    priceStatus: 'Unpaid',
    orderBy: 'Raki',
    assignedTo: 'Balli',
    tag: 'Emergency',
    dueDate: d(36),
    status: 'Ready for Collection',
  },
  {
    customerName: 'Rahman Family',
    customerPhone: '+880 1711-110001',
    customerEmail: 'rahman.family@example.com',
    title: 'Anniversary Portraits – Rahman Family',
    description: 'Studio session, 2 hours. Family of 4.',
    price: 4500,
    priceStatus: 'Paid',
    orderBy: 'Linkon',
    assignedTo: 'Johana',
    tag: 'Flexible',
    dueDate: d(48),
    status: 'Delivered',
  },
  {
    customerName: 'BRAC',
    customerPhone: '+880 1711-110007',
    customerEmail: 'events@brac.net',
    title: 'Event Coverage – BRAC Annual Gala',
    description: 'Full event coverage, 4 hours. Candid + formal shots required. 500+ edited images.',
    price: 15000,
    priceStatus: 'Unpaid',
    orderBy: 'Babu',
    assignedTo: 'Raki',
    tag: 'Emergency',
    dueDate: d(72),
    status: 'In Processing',
  },
  {
    customerName: 'Creator Studio',
    customerPhone: '+880 1711-110008',
    customerEmail: 'studio@creator.com',
    title: 'YouTube Thumbnail Shoot – Creator Studio',
    description: 'Creative portrait session for 10 thumbnails. High energy, colorful backgrounds.',
    price: 3500,
    priceStatus: 'Paid',
    orderBy: 'Johana',
    assignedTo: 'Linkon',
    tag: 'Flexible',
    dueDate: d(96),
    status: 'In Processing',
  },
];

async function upsertCustomer({ name, phone, email }) {
  const cleanPhone = phone.trim();
  const cleanEmail = email.trim().toLowerCase();
  let customer = await Customer.findOneAndUpdate(
    { $or: [{ phone: cleanPhone }, { email: cleanEmail }] },
    { $inc: { ordersCount: 1 } },
    { new: true }
  );
  if (!customer) {
    customer = await Customer.create({
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      ordersCount: 1,
    });
  }
  return customer;
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Order.deleteMany({});
    await Customer.deleteMany({});

    let inserted = 0;
    for (const o of sampleOrders) {
      const customer = await upsertCustomer({
        name: o.customerName,
        phone: o.customerPhone,
        email: o.customerEmail,
      });
      await Order.create({
        ...o,
        customer: customer._id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
      });
      inserted++;
    }

    const customerCount = await Customer.countDocuments();
    console.log(`✓ Seeded ${inserted} orders across ${customerCount} customers`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
