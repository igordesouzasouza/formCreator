import Stripe from "stripe";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const runtime = "nodejs";

export async function POST(req) {
  try {
    console.log("Iniciando criação de produto...");

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.error("Stripe key não definida");
      return Response.json({ error: "Stripe key não configurada" }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey);
    const formData = await req.formData();

    const name = formData.get("name");
    const description = formData.get("description");
    const price = formData.get("price");
    const estoque = formData.get("estoque");
    const categoria = formData.get("categoria");
    const fotoFile = formData.get("foto");

    console.log("Campos recebidos:", { name, description, price, estoque, categoria });

    // Captura medidas
    const medidas = {};
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("medidas[")) {
        medidas[key] = String(value);
      }
    }
    console.log("Medidas recebidas:", medidas);

    // Upload da imagem
    let imageUrl = "";
    if (fotoFile && typeof fotoFile.arrayBuffer === "function") {
      try {
        const buffer = Buffer.from(await fotoFile.arrayBuffer());
        const upload = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ folder: "produtos" }, (err, result) => {
              if (err) return reject(err);
              resolve(result);
            })
            .end(buffer);
        });
        imageUrl = upload?.secure_url ?? "";
      } catch (err) {
        console.error("Erro no Cloudinary:", err);
        return Response.json({ error: "Falha no upload da imagem" }, { status: 500 });
      }
    }

    if (!name || !description || !price) {
      console.error("Campos obrigatórios faltando");
      return Response.json({ error: "Preencha todos os campos obrigatórios" }, { status: 400 });
    }

    const precoInt = parseInt(price, 10);
    if (isNaN(precoInt) || precoInt <= 0) {
      console.error("Preço inválido:", price);
      return Response.json({ error: "Preço inválido" }, { status: 400 });
    }

    // Cria produto
    const product = await stripe.products.create({
      name,
      description,
      images: imageUrl ? [imageUrl] : [],
      metadata: { estoque, categoria, ...medidas },
    });

    const priceObj = await stripe.prices.create({
      product: product.id,
      unit_amount: precoInt,
      currency: "brl",
    });

    await stripe.products.update(product.id, { default_price: priceObj.id });

    console.log("Produto criado com sucesso:", product.id);

    return Response.json({ success: true, product, price: priceObj }, { status: 200 });
  } catch (error) {
    console.error("Erro geral:", error);
    return Response.json({ error: error.message || "Erro inesperado" }, { status: 500 });
  }
}
