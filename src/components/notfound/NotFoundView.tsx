import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export function NotFoundView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 px-4 text-center transition-colors duration-200">
      <div className="bg-white dark:bg-slate-800 p-10 rounded-2xl shadow-xl dark:shadow-none max-w-lg w-full flex flex-col items-center border border-slate-100 dark:border-slate-700 transition-colors duration-200">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-6 transition-colors duration-200">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-7xl font-black text-slate-900 dark:text-white mb-2 transition-colors duration-200">404</h1>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4 transition-colors duration-200">Page Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed transition-colors duration-200">
          The page you are looking for doesn't exist or has been moved. 
          Please check the URL or navigate back to the dashboard.
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transition-all duration-200 shadow-sm hover:shadow dark:shadow-none"
        >
          <Home className="w-5 h-5 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
