import Stripe from "stripe";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const runtime = "nodejs";

export async function POST(req) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return Response.json({ error: "Stripe key não definida no ambiente" }, { status: 500 });
  }
  const stripe = new Stripe(stripeKey);

  const formData = await req.formData();

  const name = formData.get("name");
  const description = formData.get("description");
  const price = formData.get("price");
  const estoque = formData.get("estoque");
  const categoria = formData.get("categoria");
  const fotoFile = formData.get("foto");

  // Captura medidas dinamicamente
  const medidas = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("medidas[")) {
      const medidaKey = key.replace("medidas[", "").replace("]", "");
      medidas[medidaKey] = String(value);
    }
  }

  let imageUrl = "";
  if (fotoFile && typeof fotoFile.arrayBuffer === "function") {
    const buffer = Buffer.from(await fotoFile.arrayBuffer());
    const upload = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder: "produtos" }, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }).end(buffer);
    });
    imageUrl = upload.secure_url;
  }

  if (!name || !description || !price || estoque === undefined || !categoria) {
    return Response.json({ error: "Preencha todos os campos" }, { status: 400 });
  }

  try {
    const product = await stripe.products.create({
      name,
      description,
      images: imageUrl ? [imageUrl] : [],
      metadata: {
        estoque: estoque.toString(),
        categoria,
        ...medidas, // busto, comprimento, etc.
      },
    });

    const priceObj = await stripe.prices.create({
      product: product.id,
      unit_amount: parseInt(price, 10),
      currency: "brl",
    });

    await stripe.products.update(product.id, {
      default_price: priceObj.id,
    });

    return Response.json({ success: true, product, price: priceObj }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
