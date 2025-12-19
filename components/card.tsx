import Image from "next/image";
import Link from "next/link";
import { Field } from "@prisma/client";
import { MapPinIcon, StarIcon } from "@heroicons/react/24/solid";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

interface CardProps {
  field: Field & { Reviews: { rating: number }[] };
}

/**
 * A card component to display a summary of a sport field.
 * It shows the field's image, name, address, rating, and price.
 * The entire card is a link to the field's detail page.
 *
 * @param {{ field: CardProps['field'] }} props - The properties for the component.
 * @param {CardProps['field']} props.field - The field data object, including its reviews.
 */
const Card = ({ field }: CardProps) => {
  const totalRating = field.Reviews.reduce((acc, review) => acc + review.rating, 0);
  const reviewCount = field.Reviews.length;
  const avgRating = reviewCount > 0 ? (totalRating / reviewCount).toFixed(1) : "0";

  return (
    <Link href={`/field/${field.id}`} className="block group h-full">
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 h-full flex flex-col relative">
        <div className="relative h-64 w-full bg-gray-100 overflow-hidden">
          <Image
            src={field.image || "/card-lapangan.jpg"}
            alt={field.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
          
          <div className="absolute top-4 left-4">
             <div className="bg-white/80 backdrop-blur-xl px-4 py-1.5 rounded-full text-[10px] font-bold text-gray-900 shadow-sm uppercase tracking-widest border border-white/20">
                {field.type.replace("_", " ")}
             </div>
          </div>
          
          {reviewCount > 0 && (
            <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-white border border-white/10 shadow-lg">
              <StarIcon className="h-3 w-3 text-yellow-400" />
              <span className="text-xs font-semibold">{avgRating}</span>
              <span className="text-[10px] text-gray-300 ml-0.5 font-normal">({reviewCount})</span>
            </div>
          )}
        </div>

        <div className="p-6 flex flex-col flex-grow justify-between bg-white relative z-10">
          <div>
            <div className="mb-3">
                <h3 className="text-xl font-bold text-gray-700 tracking-tight group-hover:text-gray-600 transition-colors">
                {field.name}
                </h3>
                <div className="flex items-center text-gray-400 text-xs font-medium mt-1.5">
                  <MapPinIcon className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                  <span className="line-clamp-2 break-words tracking-wide">{field.address}</span>
                </div>
            </div>
          </div>

          <div className="flex items-end justify-between pt-6 mt-4 border-t border-gray-50">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1">
                Start From
              </span>
              <div className="flex items-baseline gap-1">
                 <span className="text-xs text-gray-400 font-medium">IDR</span>
                 <span className="text-xl font-bold text-gray-900 tracking-tight">
                    {field.pricePerHour.toLocaleString("id-ID")}
                 </span>
                 <span className="text-xs text-gray-300 font-medium">/hour</span>
              </div>
            </div>
            
            <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-black flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm group-hover:shadow-lg">
               <ArrowRightIcon className="h-4 w-4 text-gray-900 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default Card;
