interface Address {
  line1: string;
  line2?: string;
  town: string;
  postcode: string;
}

interface Props {
  name: string;
  email: string;
  phone: string;
  address?: Address;
}

export default function ProfileCard({ name, email, phone, address }: Props) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <h3 className="text-xl font-semibold">{name}</h3>

      <p className="text-sm text-gray-600 mt-1">{email}</p>
      <p className="text-sm text-gray-600 mt-1">{phone}</p>

      {address && (
        <p className="text-sm text-gray-600 mt-3">
          {address.line1}
          {address.line2 && `, ${address.line2}`}<br />
          {address.town}, {address.postcode}
        </p>
      )}
    </div>
  );
}
