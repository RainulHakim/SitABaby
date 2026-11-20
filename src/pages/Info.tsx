import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Coffee,
  MessageCircle,
  MapPin,
  HeartHandshake,
} from "lucide-react";
export default function Info({
  kind,
}: {
  kind: "safety" | "about" | "missing";
}) {
  return (
    <div className="info-page">
      <div className="eyebrow">A LITTLE HELP. A LOT OF HEART.</div>
      <h1>
        {kind === "safety"
          ? "Good connections start with care."
          : kind === "about"
            ? "It takes a village. Let’s find yours."
            : "A little off the beaten path."}
      </h1>
      {kind === "safety" ? (
        <>
          <p className="info-intro">
            A few practical things to help both families and sitters feel
            comfortable, from the first hello.
          </p>
          {[
            [
              Coffee,
              "Meet before the first sit.",
              "Choose a public place, bring your questions, and give everyone a chance to get comfortable. A short video call can be a helpful first step.",
            ],
            [
              ShieldCheck,
              "Check references. Every time.",
              "Parents: speak to recent references and independently verify qualifications. Sitters: ask about routines, expectations, pets, and the home. Listings are not screened or background checked.",
            ],
            [
              MessageCircle,
              "Make a little plan.",
              "Agree on the hourly rate, hours, payment, and cancellation expectations. Before a sit, exchange emergency contacts and discuss allergies, medicines, and safe sleep routines.",
            ],
            [
              MapPin,
              "Keep personal details personal.",
              "Share your neighborhood here, not your address. Share an exact location only once you have spoken and feel comfortable. A photo of toys or a playroom works beautifully.",
            ],
            [
              HeartHandshake,
              "Trust your instincts.",
              "Never send advance payments to secure a job. If a request feels off, stop the conversation and report the listing. In an emergency, contact local emergency services.",
            ],
          ].map(([Icon, title, copy]) => {
            const I = Icon as typeof Coffee;
            return (
              <section className="info-block" key={String(title)}>
                <I size={25} />
                <div>
                  <h2>{String(title)}</h2>
                  <p>{String(copy)}</p>
                </div>
              </section>
            );
          })}
        </>
      ) : kind === "about" ? (
        <>
          <p className="info-intro">
            Some days, a few hours of help makes all the difference. We make it
            easier for parents and sitters to find each other, right in their
            own neighborhood.
          </p>
          <h2>A sitting request. A real connection.</h2>
          <p>
            Parents share a little about their family and the help they need.
            Sitters browse, save a few favorites, and reach out directly. No
            sign-in, no commission, no complicated booking flow.
          </p>
          <h2>The name is a little cheeky. The care is real.</h2>
          <p>
            Rent a Baby is about finding babysitting opportunities. Children are
            never for rent. Every listing is a parent’s invitation to start a
            conversation with a sitter.
          </p>
          <h2>A note on trust</h2>
          <p>
            We help people connect; we don’t screen families or sitters, verify
            identities, process payments, or guarantee bookings. Take time to
            meet and check references. Your browser stores your saved requests
            and ownership keys, so keep its data if you want to edit your
            listings later.
          </p>
        </>
      ) : (
        <p>
          This page doesn’t exist, but a lovely local family might be just a
          click away.
        </p>
      )}
      <Link to="/" className="button primary">
        Find a family
      </Link>
    </div>
  );
}
