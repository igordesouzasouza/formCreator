import { NextResponse } from "next/server";
import Stripe from "stripe";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

// Configura o Cloudinary com as credenciais do .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil", // Versão estável mais recente
});

export async function POST(request: Request) {
  try {
    console.log("[POST] Iniciando criação de produto...");

    const formData = await request.formData();

    const name = formData.get("name") as string | null;
    const description = formData.get("description") as string | null;
    const price = formData.get("price") as string | null;
    const stock = formData.get("stock") as string | null;
    const category = formData.get("category") as string | null;
    const photoFile = formData.get("photo") as File | null;

    // Coletar todas as medidas do formData
    const sizesMetadata: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("sizes[") && key.includes("_")) {
        sizesMetadata[key] = value as string;
      }
    }

    console.log("[POST] Dados recebidos:", {
      name,
      description,
      price,
      stock,
      category,
      hasPhoto: !!photoFile,
      sizesCount: Object.keys(sizesMetadata).length,
    });   
    // testet deles 

    if (!name || !description || !price) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    const priceFloat = parseFloat(price);
    if (isNaN(priceFloat) || priceFloat <= 0) {
      return NextResponse.json({ error: "Preço inválido" }, { status: 400 });
    }
    
    // Converte de reais para centavos para o Stripe
    const priceInCents = Math.round(priceFloat * 100);

    let imageUrl = "";
    if (photoFile) {
      const buffer = Buffer.from(await photoFile.arrayBuffer());
      imageUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "produtos" },
          (error, result) => (error ? reject(error) : resolve(result!.secure_url))
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });
    }

    // Preparar os metadados incluindo as medidas
    const metadata: Record<string, string> = {
      stock: stock || "0",
      category: category || "",
    };

    // Agrupar as medidas por tamanho
    const sizeGroups: Record<string, Record<string, string>> = {};
    
    Object.entries(sizesMetadata).forEach(([key, value]) => {
      // Extrair o tamanho e a medida da chave (ex: sizes[PP_busto])
      const match = key.match(/sizes\[(\w+)_(\w+)\]/);
      if (match) {
        const [, size, measure] = match;
        if (!sizeGroups[size]) {
          sizeGroups[size] = {};
        }
        sizeGroups[size][measure] = value;
      }
    });
    
    // Adicionar cada tamanho como uma string JSON separada
    Object.entries(sizeGroups).forEach(([size, measures]) => {
      metadata[`size_${size}`] = JSON.stringify(measures);
    });

    const product = await stripe.products.create({
      name,
      description,
      images: imageUrl ? [imageUrl] : [],
      metadata,
    });

    const priceObj = await stripe.prices.create({
      product: product.id,
      unit_amount: priceInCents,
      currency: "brl",
    });

    await stripe.products.update(product.id, { default_price: priceObj.id });

    console.log("[POST] Produto criado:", {
      id: product.id,
      name: product.name,
      created: new Date(product.created * 1000).toISOString(),
    });

    return NextResponse.json({ success: true, product, price: priceObj }, { status: 200 });
  } catch (error) {
    console.error("[POST] Erro:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Erro inesperado" },
      { status: 500 }
    );
  }
}