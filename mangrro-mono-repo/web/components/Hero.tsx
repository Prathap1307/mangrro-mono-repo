import Image from "next/image";
import Link from "next/link";

interface HeroProps {
  setBookOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Hero({ setBookOpen }: HeroProps) {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 px-5 py-10 text-white shadow-2xl md:px-8 md:py-16">
        
        {/* Background image overlay */}
        <div className="absolute inset-0 opacity-20">
          <Image
            src="https://images.unsplash.com/photo-1600185365483-26d7c87b7c3f?auto=format&fit=crop&w=1600&q=80"
            alt="Pickup delivery and returns service"
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col-reverse gap-8 md:flex-row md:items-center md:justify-between">
          
          {/* LEFT CONTENT */}
          <div className="max-w-2xl space-y-4 md:space-y-6">

            {/* MOBILE COPY */}
            <div className="md:hidden space-y-3">
              <h1 className="text-3xl font-extrabold leading-tight">
                Pickup, Delivery & Returns
              </h1>
              <p className="text-base text-white/90">
                We collect from stores and deliver or return items for you.
              </p>
            </div>

            {/* DESKTOP COPY */}
            <div className="hidden md:block space-y-5">
              <p className="text-sm uppercase tracking-[0.3em] text-white/80">
                Pickup · Delivery · Returns
              </p>

              <h1 className="text-5xl font-extrabold leading-tight">
                Shop anywhere. <br />
                We collect, deliver, or return for you.
              </h1>

              <p className="text-lg text-white/90">
                Bought something in-store or need to return an online order?
                Upload your receipt or return label, choose pickup and drop-off —
                we’ll handle the rest.
              </p>

              <ul className="space-y-2 text-sm text-white/90">
                <li>✔ In-store purchase collection</li>
                <li>✔ Home or office delivery</li>
                <li>✔ Online & in-store returns</li>
              </ul>
            </div>

            {/* CTA BUTTONS */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setBookOpen(true)}
                className="flex-1 rounded-full bg-white px-5 py-3 text-center text-base font-semibold text-purple-700 shadow-lg transition hover:-translate-y-0.5"
              >
                Book Delivery
              </button>

              <Link
                href="/our-items"
                className="flex-1 rounded-full border border-white/70 px-5 py-3 text-center text-base font-semibold text-white backdrop-blur hover:bg-white/10"
              >
                Our Items
              </Link>
            </div>
          </div>

          {/* RIGHT IMAGE CARD */}
          <div className="relative w-full max-w-sm self-center">
            <div className="absolute inset-0 -translate-y-4 translate-x-4 rounded-3xl bg-white/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-3xl bg-white/10 p-3 shadow-xl backdrop-blur">
              <div className="relative h-64 w-full overflow-hidden rounded-2xl md:h-72">
                <Image
                  src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80"
                  alt="Courier collecting parcel"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 320px"
                />
              </div>

              <div className="mt-3 space-y-1 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-purple-100">
                  One service
                </p>
                <h3 className="text-lg font-bold">Purchases & Returns</h3>
                <p className="text-sm text-purple-50">
                  From store pickup to doorstep delivery — or return drop-off.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STICKY MOBILE CTA BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex gap-3 bg-white p-3 shadow-lg md:hidden">
        <button
          onClick={() => setBookOpen(true)}
          className="flex-1 rounded-xl bg-purple-600 py-3 text-center font-semibold text-white"
        >
          Book Delivery
        </button>
        <Link
          href="/our-items"
          className="flex-1 rounded-xl border py-3 text-center font-semibold text-gray-900"
        >
          Our Items
        </Link>
      </div>
    </>
  );
}
