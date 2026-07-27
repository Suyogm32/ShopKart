import { Customer } from "@/models/Customer";
import { mongooseConnect } from "@/lib/mongoose";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

const requireFields = (body) => {
  const missing = ["address", "city", "postalcode", "country"].filter((f) => !body?.[f]?.trim());
  return missing.length ? `Missing: ${missing.join(", ")}.` : null;
};

const getCustomer = async (session) => {
  await mongooseConnect();
  return Customer.findById(session.user.id);
};

export const POST = async (req) => {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: "Not signed in." }, { status: 401 });

    const body = await req.json();
    const invalid = requireFields(body);
    if (invalid) return NextResponse.json({ message: invalid }, { status: 400 });

    const customer = await getCustomer(session);
    if (!customer) return NextResponse.json({ message: "Account not found." }, { status: 404 });

    // First address added becomes the default automatically.
    const makeDefault = body.isDefault || customer.addresses.length === 0;
    if (makeDefault) customer.addresses.forEach((a) => (a.isDefault = false));

    customer.addresses.push({
      label: body.label?.trim() || "Home",
      address: body.address.trim(),
      city: body.city.trim(),
      postalcode: body.postalcode.trim(),
      state: body.state?.trim() || "",
      country: body.country.trim(),
      isDefault: makeDefault,
    });

    await customer.save();
    return NextResponse.json({ data: customer.addresses }, { status: 201 });
  } catch (error) {
    console.error("Add address error:", error);
    return NextResponse.json({ message: "Error saving address." }, { status: 500 });
  }
};

export const PUT = async (req) => {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: "Not signed in." }, { status: 401 });

    const body = await req.json();
    if (!body?.addressId) {
      return NextResponse.json({ message: "Address id is required." }, { status: 400 });
    }

    const customer = await getCustomer(session);
    if (!customer) return NextResponse.json({ message: "Account not found." }, { status: 404 });

    const target = customer.addresses.id(body.addressId);
    if (!target) return NextResponse.json({ message: "Address not found." }, { status: 404 });

    if (body.isDefault) {
      customer.addresses.forEach((a) => (a.isDefault = false));
      target.isDefault = true;
    }

    ["label", "address", "city", "postalcode", "state", "country"].forEach((f) => {
      if (body[f] !== undefined) target[f] = String(body[f]).trim();
    });

    await customer.save();
    return NextResponse.json({ data: customer.addresses });
  } catch (error) {
    console.error("Update address error:", error);
    return NextResponse.json({ message: "Error updating address." }, { status: 500 });
  }
};

export const DELETE = async (req) => {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: "Not signed in." }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const addressId = searchParams.get("id");
    if (!addressId) {
      return NextResponse.json({ message: "Address id is required." }, { status: 400 });
    }

    const customer = await getCustomer(session);
    if (!customer) return NextResponse.json({ message: "Account not found." }, { status: 404 });

    const wasDefault = customer.addresses.id(addressId)?.isDefault;
    customer.addresses.pull({ _id: addressId });

    // Don't leave the book without a default if others remain.
    if (wasDefault && customer.addresses.length) customer.addresses[0].isDefault = true;

    await customer.save();
    return NextResponse.json({ data: customer.addresses });
  } catch (error) {
    console.error("Delete address error:", error);
    return NextResponse.json({ message: "Error deleting address." }, { status: 500 });
  }
};