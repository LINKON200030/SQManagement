import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import OrderSection from '../components/OrderSection';
import InfoCard from '../components/InfoCard';
import useOrderStore from '../store/orderStore';

function HomePage() {
  const { todayOrders, upcomingOrders, loading, error, fetchAllSections } = useOrderStore();

  useEffect(() => {
    fetchAllSections();
  }, []);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-7 max-w-[1400px] mx-auto">
      {error && (
        <div className="mb-5 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm shadow-sm">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <p className="font-semibold">Cannot reach server</p>
            <p className="text-red-500 text-xs mt-0.5">
              Make sure the backend is running on port 5000.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <OrderSection
            title="Today's Orders"
            accent="red"
            orders={todayOrders}
            loading={loading}
            emptyMessage="No orders due today"
          />

          <OrderSection
            title="Upcoming Orders"
            accent="black"
            orders={upcomingOrders}
            loading={loading}
            emptyMessage="No upcoming orders"
          />

          <div className="flex justify-end">
            <Link
              to="/orders"
              className="flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-all"
            >
              All Orders
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-3">
          <InfoCard />
        </div>
      </div>
    </div>
  );
}

export default HomePage;
