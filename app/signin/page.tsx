import { Metadata } from "next";
import { LoginGoogleButton } from "@/components/login-button";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign In",
};

const SignInPage = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <Image
        src="/well-2.png"
        alt="Background"
        fill
        className="object-cover object-center w-full h-full"
      />
      <div className="relative bg-white/30 backdrop-blur-md border border-white/20 shadow-xl max-w-sm w-full rounded-2xl p-8 z-10">
        <Link href="/" className="flex justify-center mb-6">
          <Image
            src="/lapang-in.png"
            width={120}
            height={46}
            alt="logo"
          />
        </Link>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
            Sign In
          </h1>
          <p className="font-medium mb-6 text-gray-200">
            Sign In to Your Account
          </p>
        </div>
        <div className="py-4 text-center">
          <LoginGoogleButton />
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
