import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <section className="py-16 text-center">
      <h1 className="text-4xl font-bold">Your measurements, stitched right.</h1>
      <p className="mx-auto mt-4 max-w-xl text-stone-600">
        Send your blouse or kurti measurements to the boutique in one simple form. Owners track
        every order from pending to delivered.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/order" className="btn">Place an Order</Link>
        <Link to="/track" className="btn-outline">Track Order</Link>
        <Link to="/login" className="btn-outline">I'm the Owner</Link>
      </div>
    </section>
  );
}
