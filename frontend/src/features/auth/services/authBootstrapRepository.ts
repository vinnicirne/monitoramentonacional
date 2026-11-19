import { getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { firestoreRefs } from '../../../shared/firebase/firestoreRefs';

const DEFAULT_PLANS = [
  {
    id: 'free_corp',
    name: 'Free Corporativo / Indicado',
    description: 'Acesso completo ao mapa, dossiês de DPs, áreas de facções e consulta de endereços.',
    priceMonthly: 0,
    billingModel: 'fixed',
    pricePerLicense: 0,
    maxQueriesPerMonth: 500,
    features: [
      'Dossiês das 137 CISPs e 41 AISPs',
      'Base de 1.695 áreas de risco',
      'Busca OSM + GPS em tempo real',
      'Liberação automática @mercadolivre.com'
    ],
    active: true
  },
  {
    id: 'pro_mensal',
    name: 'Operacional Pro',
    description: 'Para analistas externos e equipes de logística com relatórios e auditoria.',
    priceMonthly: 99,
    billingModel: 'fixed',
    pricePerLicense: 99,
    maxQueriesPerMonth: 5000,
    features: [
      'Todos os recursos do Free Corporativo',
      'Estatísticas ISP-RJ e Auditoria',
      'Impressão oficial de Dossiê PDF',
      'Suporte prioritário'
    ],
    active: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise & Governança',
    description: 'Controle multiusuário ilimitado, base SIG MG·ES completa e gestão executiva.',
    priceMonthly: 299,
    billingModel: 'fixed',
    pricePerLicense: 299,
    maxQueriesPerMonth: 999999,
    features: [
      'Consultas ilimitadas em RJ, MG e ES',
      'Exportação CSV UTF-8 & Python QGIS',
      'Gestão de domínios e indicações',
      'Painel de rastreabilidade completo'
    ],
    active: true
  }
];

export async function ensureAdminSeedData(uid: string, email: string): Promise<void> {
  try {
    const adminRef = firestoreRefs.admin(uid);
    const adminSnapshot = await getDoc(adminRef);
    if (!adminSnapshot.exists()) {
      await setDoc(adminRef, { uid, email, createdAt: serverTimestamp() });
    }

    const meliDomainRef = firestoreRefs.freeDomain('mercadolivre.com');
    const meliDomainSnapshot = await getDoc(meliDomainRef);
    if (!meliDomainSnapshot.exists()) {
      await setDoc(meliDomainRef, {
        domain: 'mercadolivre.com',
        label: 'Mercado Livre (Acesso Free & Indicação Direta)',
        active: true,
        autoApproveReferrals: true,
        defaultPlanId: 'free_corp',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    const plansSnapshot = await getDocs(firestoreRefs.plans());
    if (plansSnapshot.empty) {
      for (const plan of DEFAULT_PLANS) {
        await setDoc(firestoreRefs.plan(plan.id), {
          ...plan,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }

    const corporatePlanRef = firestoreRefs.plan('corp_licenca');
    const corporatePlanSnapshot = await getDoc(corporatePlanRef);
    if (!corporatePlanSnapshot.exists()) {
      await setDoc(corporatePlanRef, {
        id: 'corp_licenca',
        name: 'Corporativo Por Licença',
        description: 'Plano empresarial com cobrança por licença individual vinculada ao domínio @empresa.com.',
        priceMonthly: 49,
        billingModel: 'per_user',
        pricePerLicense: 49,
        maxQueriesPerMonth: 999999,
        features: [
          'Licença nominal vinculada a @empresa.com',
          'Consultas ilimitadas RJ, MG e ES',
          'Estatísticas ISP-RJ, Auditoria & PDF',
          'Faturamento mensal por usuário ativo'
        ],
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.warn('Seed admin defaults notice:', error);
  }
}
