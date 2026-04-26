import { ExternalLink, Landmark, Link2, MapPin } from 'lucide-react';

const BANK = {
  accountName: 'Surrey Quays Photo Studio Ltd',
  accountNumber: '73928195',
  sortCode: '40-06-21',
};

const FILM_ADDRESS = [
  'The Photo Shop',
  '10 Tudor Row',
  'Wade Street',
  'Lichfield',
  'Staffordshire',
  'WS13 6HH',
];

const DRIVE = {
  account: 'surreyquaysphotostudio@gmail.com',
  href: 'https://drive.google.com',
};

function InfoCard() {
  return (
    <div className="flex flex-col gap-5">
      {/* Company Bank Details */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-black px-5 py-3.5 flex items-center gap-2">
          <Landmark className="w-4 h-4 text-white/80" />
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">
            Company Bank Details
          </h2>
        </div>

        <div className="p-5 space-y-4">
          <InfoRow label="Account Name" value={BANK.accountName} />
          <InfoRow label="Account Number" value={BANK.accountNumber} mono />
          <InfoRow label="Sort Code" value={BANK.sortCode} mono />
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-red-600 px-5 py-3.5 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-white/90" />
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">Quick Links</h2>
        </div>

        <div className="p-5 space-y-3">
          <a
            href={DRIVE.href}
            target="_blank"
            rel="noreferrer"
            className="block border border-slate-200 rounded-lg p-3.5 hover:border-red-200 hover:bg-red-50/30 transition-colors group"
          >
            <p className="text-sm font-bold text-black flex items-center gap-2 group-hover:text-red-600">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              Google Drive
              <ExternalLink className="w-3 h-3 ml-auto opacity-60" />
            </p>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed pl-4 break-all">
              {DRIVE.account}
            </p>
          </a>

          <div className="border border-slate-200 rounded-lg p-3.5 hover:border-red-200 hover:bg-red-50/30 transition-colors">
            <p className="text-sm font-bold text-black flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              Film Sending Address
              <MapPin className="w-3.5 h-3.5 ml-auto text-slate-400" />
            </p>
            <address className="text-xs text-slate-600 mt-1.5 leading-relaxed pl-4 not-italic">
              {FILM_ADDRESS.map((line, i) => (
                <span key={line} className={i === 0 ? 'block font-bold text-black' : 'block'}>
                  {line}
                </span>
              ))}
            </address>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1">
        {label}
      </p>
      <p
        className={`text-sm font-bold text-black ${mono ? 'font-mono tracking-wide' : ''}`}
      >
        {value}
      </p>
    </div>
  );
}

export default InfoCard;
