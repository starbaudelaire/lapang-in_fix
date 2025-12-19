"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { IoMenu, IoPersonOutline } from "react-icons/io5";
import { QrCodeIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useSession, signOut } from "next-auth/react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetPortal,
} from "@/components/ui/sheet";

/**
 * Renders the main navigation bar for the application.
 * It includes responsive handling for desktop and mobile views,
 * conditional links based on user authentication status and role (admin/user),
 * and a mobile-friendly sheet menu.
 */
const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { data: session } = useSession();

  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuRef]);

  const isAdmin = session?.user?.role === "admin";

  return (
    <div className="fixed top-0 w-full z-50 bg-white/10 backdrop-blur-md border-b border-white/20 shadow-sm transition-all">
      <div className="max-w-screen-xl mx-auto p-4">
        {/* Desktop Navigation */}
        <div className="hidden md:flex justify-center items-center space-x-6">
          <Link href="/">
            <Image
              src="/lapang-in.png"
              width={27}
              height={27}
              alt="logo"
              priority
            />
          </Link>

          {isAdmin ? (
            <Link
              href="/admin/dashboard"
              className="font-light text-sm text-white hover:text-white/80 transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/"
              className="font-light text-sm text-white hover:text-white/80 transition-colors"
            >
              Home
            </Link>
          )}

          {!isAdmin && (
            <Link
              href="/field"
              className="font-light text-sm text-white hover:text-white/80 transition-colors"
            >
              Fields
            </Link>
          )}

          {session && (
            <>
              {isAdmin ? (
                <Link
                  href="/admin/revenue"
                  className="font-light text-sm text-white hover:text-white/80 transition-colors"
                >
                  Revenue
                </Link>
              ) : (
                <Link
                  href="/myreservation"
                  className="font-light text-sm text-white hover:text-white/80 transition-colors"
                >
                  Schedule
                </Link>
              )}

              {isAdmin && (
                <Link
                  href="/admin/field"
                  className="font-light text-sm text-white hover:text-white/80 transition-colors"
                >
                  Manage
                </Link>
              )}
            </>
          )}

          {isAdmin ? (
            <Link
              href="/admin/scan"
              className="font-light text-sm text-white hover:text-white/80 transition-colors flex items-center gap-1"
            >
              <QrCodeIcon className="w-4 h-4" />
              Scan QR
            </Link>
          ) : (
            <Link
              href="/about"
              className="font-light text-sm text-white hover:text-white/80 transition-colors"
            >
              About
            </Link>
          )}

          {!isAdmin && (
            <Link
              href="/contact"
              className="font-light text-sm text-white hover:text-white/80 transition-colors"
            >
              Contact
            </Link>
          )}

          <div className="relative" ref={profileMenuRef}>
            {session ? (
              <>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex text-sm rounded-full focus:ring-4 focus:ring-gray-300/50"
                >
                  <span className="sr-only">Open user menu</span>
                  <Image
                    className="size-8 rounded-full"
                    src={session.user.image || "/avatar.svg"}
                    width={32}
                    height={32}
                    alt="avatar"
                  />
                </button>

                <div
                  className={clsx(
                    "absolute right-0 z-50 my-2 w-48 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow",
                    { hidden: !isProfileOpen }
                  )}
                >
                  <div className="px-4 py-3">
                    <span className="block text-sm text-gray-900">
                      {session.user.name}
                    </span>
                    <span className="block text-sm text-gray-500 truncate">
                      {session.user.email}
                    </span>
                  </div>
                  <ul className="py-2">
                    <li>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          signOut();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <Link href="/signin">
                <IoPersonOutline className="size-5 text-white hover:text-white/80 transition-colors" />
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden justify-between items-center">
          <Link href="/">
            <Image
              src="/lapang-in.png"
              width={32}
              height={32}
              alt="logo"
              priority
            />
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="inline-flex items-center p-2 justify-center text-sm rounded-md text-white hover:bg-white/20 z-50">
                <IoMenu className="size-8" />
              </button>
            </SheetTrigger>
            <SheetPortal>
              <SheetContent
                side="right"
                className="w-[300px] sm:w-[400px] bg-white z-[9999]"
              >
              <SheetHeader>
                <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                <SheetDescription className="sr-only">
                  Navigation links
                </SheetDescription>
                <div className="flex items-center justify-start mb-6">
                  <Link href="/" onClick={() => setOpen(false)}>
                    <Image
                      src="/lapang-in.png"
                      width={40}
                      height={40}
                      alt="logo"
                    />
                  </Link>
                </div>
              </SheetHeader>
              <div className="flex flex-col gap-6 mt-6">
                <ul className="flex flex-col space-y-4 font-medium text-gray-900">
                  <li>
                    {isAdmin ? (
                      <Link
                        href="/admin/dashboard"
                        className="block py-2 hover:text-gray-600 border-b border-gray-100"
                        onClick={() => setOpen(false)}
                      >
                        Dashboard
                      </Link>
                    ) : (
                      <Link
                        href="/"
                        className="block py-2 hover:text-gray-600 border-b border-gray-100"
                        onClick={() => setOpen(false)}
                      >
                        Home
                      </Link>
                    )}
                  </li>

                  {!isAdmin && (
                    <li>
                      <Link
                        href="/field"
                        className="block py-2 hover:text-gray-600 border-b border-gray-100"
                        onClick={() => setOpen(false)}
                      >
                        Fields
                      </Link>
                    </li>
                  )}

                  {session && (
                    <>
                      <li>
                        {isAdmin ? (
                          <Link
                            href="/admin/revenue"
                            className="block py-2 hover:text-gray-600 border-b border-gray-100"
                            onClick={() => setOpen(false)}
                          >
                            Revenue
                          </Link>
                        ) : (
                          <Link
                            href="/myreservation"
                            className="block py-2 hover:text-gray-600 border-b border-gray-100"
                            onClick={() => setOpen(false)}
                          >
                            Schedule
                          </Link>
                        )}
                      </li>
                      {isAdmin && (
                        <li>
                          <Link
                            href="/admin/field"
                            className="block py-2 hover:text-gray-600 border-b border-gray-100"
                            onClick={() => setOpen(false)}
                          >
                            Manage Fields
                          </Link>
                        </li>
                      )}
                    </>
                  )}
                  <li>
                    {isAdmin ? (
                      <Link
                        href="/admin/scan"
                        className="block py-2 hover:text-gray-600 flex items-center gap-2 border-b border-gray-100"
                        onClick={() => setOpen(false)}
                      >
                        <QrCodeIcon className="w-5 h-5 inline" /> Scan QR Ticket
                      </Link>
                    ) : (
                      <Link
                        href="/about"
                        className="block py-2 hover:text-gray-600 border-b border-gray-100"
                        onClick={() => setOpen(false)}
                      >
                        About
                      </Link>
                    )}
                  </li>

                  {!isAdmin && (
                    <li>
                      <Link
                        href="/contact"
                        className="block py-2 hover:text-gray-600 border-b border-gray-100"
                        onClick={() => setOpen(false)}
                      >
                        Contact
                      </Link>
                    </li>
                  )}

                  {session ? (
                    <li className="pt-4">
                      <div className="mb-4">
                        <span className="block text-sm font-semibold text-gray-900">
                          {session.user.name}
                        </span>
                        <span className="block text-sm text-gray-500 truncate">
                          {session.user.email}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setOpen(false);
                          signOut();
                        }}
                        className="w-full text-left py-2 text-red-600 hover:text-red-700 font-semibold"
                      >
                        Sign Out
                      </button>
                    </li>
                  ) : (
                    <li className="pt-4">
                      <Link
                        href="/signin"
                        className="block w-full text-center py-3 bg-[#0A84FF] text-white font-semibold rounded-lg shadow hover:bg-[#0666cc] transition-all"
                        onClick={() => setOpen(false)}
                      >
                        Sign In
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            </SheetContent>
            </SheetPortal>
          </Sheet>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
