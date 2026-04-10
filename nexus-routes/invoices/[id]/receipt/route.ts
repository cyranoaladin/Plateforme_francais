import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import { generateReceiptPDF } from '@/lib/invoices/receipt-generator';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { user: true, payment: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
  }

  // Vérifier que l'utilisateur a le droit de voir ce reçu
  if (invoice.userId !== session.user?.id && session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  // Vérifier que la facture est payée
  if (invoice.status !== 'PAID') {
    return NextResponse.json({ error: 'Facture non payée' }, { status: 400 });
  }

  try {
    const pdfBuffer = await generateReceiptPDF(invoice);
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="recu-${invoice.number}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Erreur génération reçu:', error);
    return NextResponse.json({ error: 'Erreur génération reçu' }, { status: 500 });
  }
}
