import { Metadata } from "next";
import Image from "next/image";
import { IoEyeOutline, IoLocateOutline } from "react-icons/io5";
import HeaderSection from "@/components/header-section";

export const metadata: Metadata = {
  title: "About",
};

const page = () => {
  return (
    <div>
      <HeaderSection
        title="Get to Know Us"
        subTitle="The Men Behind the Code."
      />
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          A team of sport lovers and tech builders, creating a platform that
          turns court booking into a smooth digital experience.
        </p>
        <Image
          src="/fotokitablur1.jpeg"
          width={900}
          height={600}
          alt="about image"
          className="rounded-2xl mt-12 mb-16 shadow-lg"
        />
        <div className="grid md:grid-cols-2 gap-12 text-left">
          <div className="flex gap-5">
            <div className="flex-none mt-1">
              <IoEyeOutline className="size-8 text-[#f64e42]" />
            </div>
            <div className="flex-1">
              <h4 className="text-2xl font-semibold mb-2">Vision : </h4>
              <p className="text-gray-600">
                To make booking sports fields as easy as ordering coffee-fast,
                smooth, and always available. We want every player, team, and
                community to feel connected through the power of play and tech.
              </p>
            </div>
          </div>
          <div className="flex gap-5">
            <div className="flex-none mt-1">
              <IoLocateOutline className="size-8 text-[#f64e42]" />
            </div>
            <div className="flex-1">
              <h4 className="text-2xl font-semibold mb-2">Mission : </h4>
              <p className="text-gray-600">
                We’re here to simplify how people find and book courts, support
                local venues with smart tools, and build a digital playground
                where sports meet convenience. No more double bookings, no more
                drama-just game on.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
