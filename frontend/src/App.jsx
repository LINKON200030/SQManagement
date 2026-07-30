import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AllOrdersPage from './pages/AllOrdersPage';
import CreateOrderPage from './pages/CreateOrderPage';
import CustomersPage from './pages/CustomersPage';
import AdminPage from './pages/AdminPage';
import GalleriesPage from './pages/GalleriesPage';
import KnowledgeHubPage from './pages/KnowledgeHubPage';
import InvoicePage from './pages/InvoicePage';
import CasesPage from './pages/CasesPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/invoice/:orderId" element={<InvoicePage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/orders" element={<AllOrdersPage />} />
          <Route path="/orders/new" element={<CreateOrderPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/galleries" element={<GalleriesPage />} />
          <Route path="/knowledge" element={<KnowledgeHubPage />} />
          <Route path="/cases" element={<CasesPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
