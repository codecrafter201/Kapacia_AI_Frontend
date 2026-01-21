import { Link } from "react-router-dom";
import { paths } from "@/app/routes/paths";

export default function NotFoundPage() {
  return (
    <div className="flex justify-center items-center bg-gray-50 min-h-screen">
      <div className="text-center">
        <h1 className="font-bold text-gray-800 text-9xl">404</h1>
        <h2 className="mt-4 font-semibold text-gray-700 text-4xl">
          Page Not Found
        </h2>
        <p className="mt-4 mb-8 text-gray-600">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to={paths.home}
          className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white transition-colors"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
}
