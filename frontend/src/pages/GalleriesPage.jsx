import { Images } from 'lucide-react';
import GalleriesTab from '../components/admin/GalleriesTab';

function GalleriesPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-7 max-w-[1400px] mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center shadow-md">
          <Images className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-black tracking-tight">Create Gallery</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Private, token-gated client galleries with print sales.
          </p>
        </div>
      </div>
      <GalleriesTab />
    </div>
  );
}

export default GalleriesPage;
