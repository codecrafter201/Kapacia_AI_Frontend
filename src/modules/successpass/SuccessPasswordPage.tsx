import LoginLeftAnime from "../login/components/LoginLeftAnime";
import { Link } from "react-router-dom";

function SuccessPasswordPage() {
  return (
    <div className="flex justify-center items-center min-h-screen overflow-hidden">
      <div className="flex flex-col justify-center items-center px-8 py-12 w-full md:w-1/2 text-white">
        <div className="space-y-8 w-full max-w-md">
          {/* Header */}
          <div className="text-center">
            <img
              src="/images/auth/confrim.svg"
              alt="Zyranor Logo"
              width={60}
              height={60}
              className="mx-auto mb-4"
            />
            <h1 className="mb-2 font-semibold text-black text-xl">
              Successfull
            </h1>
            <p className="text-[13px] text-gray-400">
              Congratulations! Your password has been successfully updated.
              Click Continue to login
            </p>
          </div>

          <Link
            to="/login"
            type="submit"
            className="flex justify-center bg-primary disabled:opacity-50 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 w-full font-semibold text-white disabled:transform-none hover:scale-[1.02] transition-all duration-200 disabled:cursor-not-allowed transform"
          >
            Continue
          </Link>
        </div>
      </div>
      <div className="hidden relative md:flex justify-center items-center md:w-1/2">
        <LoginLeftAnime />
      </div>
    </div>
  );
}

export default SuccessPasswordPage;
