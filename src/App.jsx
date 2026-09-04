import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Clock,
  MapPin,
  ShoppingBag,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Flame,
  Award,
  Beef,
  MessageCircle,
  Phone,
  Navigation,
  ChevronRight,
  X,
  Utensils,
  Heart,
  Zap,
  AlignJustify,
  ArrowUpRight,
  Check,
  CreditCard,
  Banknote,
  QrCode,
  Copy,
  Loader2,
  Package,
  User,
} from "lucide-react";
import { getProducts, getSettings, getDiscounts, getDiscountedPrice, hydrateFromSql, createOrder, verifyPixOrder } from "./lib/adminStore";
import { DEFAULT_PRODUCTS } from "./lib/defaultData";

function Instagram({ className, ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} {...props} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ============================================================================
// CONFIG — DADOS REAIS
// ============================================================================
// FIX: 3622-3376 é fixo e NÃO está no WhatsApp (erro "não está no WhatsApp").
// WhatsApp real é o móvel (48) 98845-2532 (ver Facebook oficial). Fixo mantido só para "Ligar".
const WHATSAPP_NUMBER = "5548988452532";
const WHATSAPP_DISPLAY = "(48) 98845-2532";
const PHONE_DISPLAY = "(48) 3622-3376";
const PHONE_TEL = "+554836223376";
const INSTAGRAM_URL = "https://instagram.com/bokalokalanchestb";
const IFOOD_URL = "https://www.ifood.com.br/delivery/tubarao-sc/boka-loka-lanches-santo-antonio-de-padua/d17f480a-0eae-4876-8071-c635950e85ef";
const ADDRESS = "Av. Pedro Zapelini, 1450 – Centro, Tubarão – SC, 88701-730";
const GMAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`;
const GMAPS_EMBED = `https://maps.google.com/maps?q=${encodeURIComponent(ADDRESS)}&t=&z=17&ie=UTF8&iwloc=&output=embed`;
const OPEN_HOUR = 18;
const CLOSE_HOUR = 0;

// ============================================================================
// HERO — UMA ÚNICA IMAGEM POR SABOR, 100% CONDIZENTE (fotos aprimoradas reais do Boka Loka)
// Cada card mostra UM lanche isolado com alta definição e apelo apetitoso
// ============================================================================
const HERO_FLAVORS = [
  {
    id: "x-mignon",
    name: "X-Mignon",
    ingredients: ["filé mignon", "queijo", "bacon", "alface", "tomate", "molho da casa"],
    price: 35.5,
    description: "Filé mignon suculento, queijo derretido, bacon crocante, alface, tomate e molho da casa.",
    badge: "EM DESTAQUE",
    accent: "#e30613",
    image: "/images/x_mignon.jpg",
  },
  {
    id: "x-salada",
    name: "X-Salada",
    ingredients: ["pão brioche", "carne 180g", "queijo", "alface", "tomate", "milho", "ervilha", "batata palha"],
    price: 28.9,
    description: "Pão brioche, carne 180g, queijo, alface, tomate, milho, ervilha e batata palha crocante.",
    badge: "MAIS PEDIDO",
    accent: "#e30613",
    image: "/images/x_salada.jpg",
  },
  {
    id: "x-bacon",
    name: "X-Bacon Supremo",
    ingredients: ["pão brioche", "carne 180g", "queijo cheddar", "bacon crocante", "alface", "tomate", "maionese da casa"],
    price: 34.9,
    description: "Bacon defumado ultra crocante com cheddar derretido. Puro poder.",
    badge: "MAIS PEDIDO",
    accent: "#e30613",
    image: "/images/x_bacon.jpg",
  },
  {
    id: "boka-brabo-hero",
    name: "Boka Brabo",
    ingredients: ["blend angus 200g", "muçarela", "cebola caramelizada", "picles", "molho picante"],
    price: 38.9,
    description: "O campeão autoral. Blend Angus 200g, cebola caramelizada e molho brabo picante.",
    badge: "EXCLUSIVO BOKA",
    accent: "#e30613",
    image: "/images/boka_brabo.jpg",
  },
  {
    id: "x-tudo",
    name: "X-Tudo",
    ingredients: ["carne 180g", "queijo duplo", "bacon", "ovo", "alface", "tomate", "milho", "palha"],
    price: 39.9,
    description: "Completo de verdade — tudo que você ama em um só lanche gigante.",
    badge: "ESPECIAL",
    accent: "#e30613",
    image: "/images/x_tudo.jpg",
  },
  {
    id: "x-frango-crocante-hero",
    name: "X-Frango Crocante",
    ingredients: ["filé frango empanado 150g", "queijo", "alface", "tomate", "maionese verde"],
    price: 31.9,
    description: "Filé de frango super crocante empanado no ponto perfeito com maionese verde.",
    badge: "CROCANTE",
    accent: "#e30613",
    image: "/images/x_frango.jpg",
  },
  {
    id: "bauru-hero",
    name: "Bauru da Casa",
    ingredients: ["pão francês prensado", "presunto", "muçarela derretida", "tomate", "orégano"],
    price: 26.9,
    description: "O clássico Bauru prensado no pão francês quentinho com muçarela derretida.",
    badge: "TRADICIONAL",
    accent: "#e30613",
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=900&q=80&auto=format&fit=crop&crop=center",
  },
  {
    id: "misto-hero",
    name: "Misto Quente na Chapa",
    ingredients: ["pão de forma", "presunto", "muçarela", "manteiga tostada"],
    price: 18.9,
    description: "Misto quente no pão de forma bem dourado e tostado na manteiga.",
    badge: "CLÁSSICO",
    accent: "#e30613",
    image: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=900&q=80&auto=format&fit=crop&crop=center",
  },
];

// ============================================================================
// CARDÁPIO — IMAGENS ÚNICAS E CONDIZENTES PARA CADA PRODUTO (SEM REPETIÇÃO)
// ============================================================================
const MENU_PRODUCTS = [
  // --- CLÁSSICOS & ESPECIAIS ---
  { id: "x-mignon", name: "X-Mignon", desc: "Filé mignon 180g, queijo muçarela, bacon crocante, alface, tomate e molho da casa.", price: 35.5, category: "Especiais", image: "/images/x_mignon.jpg", badge: "EM DESTAQUE", popular: true },
  { id: "x-salada", name: "X-Salada", desc: "Pão brioche selado, carne 180g, queijo muçarela, alface americana, tomate, milho, ervilha e batata palha extra crocante.", price: 28.9, category: "Clássicos", image: "/images/x_salada.jpg", badge: "Confirmado", popular: true },
  { id: "x-burguer", name: "X-Burguer", desc: "Pão brioche, carne 180g, queijo cheddar derretido e maionese da casa.", price: 24.9, category: "Clássicos", image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Clássico" },
  { id: "x-egg", name: "X-Egg", desc: "Carne 180g, queijo, ovo frito na chapa, alface e tomate.", price: 30.9, category: "Clássicos", image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Clássico" },
  { id: "x-bacon", name: "X-Bacon Supremo", desc: "Carne 180g, cheddar cremoso, bacon defumado ultra crocante, alface, tomate e maionese da casa.", price: 34.9, category: "Clássicos", image: "/images/x_bacon.jpg", badge: "Mais pedido", popular: true },
  { id: "x-calabresa", name: "X-Calabresa", desc: "Carne 180g, calabresa fatiada, queijo muçarela, vinagrete e maionese verde.", price: 32.9, category: "Clássicos", image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Clássico" },
  { id: "bauru", name: "Bauru da Casa", desc: "Presunto, muçarela derretida, tomate, alface, orégano e pão francês prensado.", price: 26.9, category: "Clássicos", image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Clássico" },
  { id: "x-coracao", name: "X-Coração", desc: "Coração de frango 150g, queijo, alface, tomate, milho e maionese da casa.", price: 33.9, category: "Clássicos", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Clássico" },
  { id: "x-picanha", name: "X-Picanha 200g", desc: "Picanha fatiada 200g, queijo muçarela, alface, tomate e molho verde.", price: 42.9, category: "Especiais", image: "https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Premium", popular: true },
  { id: "x-alcatra", name: "X-Alcatra", desc: "Alcatra 180g, queijo, bacon, alface, tomate e ovo.", price: 36.9, category: "Especiais", image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Especial" },
  { id: "bauru-forno", name: "Bauru de Forno", desc: "Pão francês, presunto, muçarela, tomate, orégano, recheio cremoso gratinado no forno.", price: 29.9, category: "Clássicos", image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Forno" },
  { id: "misto-quente", name: "Misto Quente", desc: "Pão de forma, presunto, muçarela e manteiga na chapa. Simples e quentinho.", price: 18.9, category: "Clássicos", image: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Clássico" },
  { id: "x-egg-bacon-duplo", name: "X-Egg Bacon Duplo", desc: "2x carne 180g, queijo duplo, 2 ovos, bacon extra, alface e tomate.", price: 41.9, category: "Especiais", image: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Duplo" },
  { id: "bauru-duplo", name: "Bauru Duplo", desc: "Dobro de presunto e muçarela, tomate, alface, orégano no pão francês prensado.", price: 32.9, category: "Clássicos", image: "https://images.unsplash.com/photo-1475090169767-40ea8d6ed07e?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Duplo" },
  // --- FRANGO ---
  { id: "x-frango", name: "X-Frango Crocante", desc: "Filé de frango empanado 150g, queijo, alface, tomate e molho especial da casa.", price: 31.9, category: "Frango", image: "/images/x_frango.jpg", badge: "Frango", popular: true },
  { id: "x-frango-bacon", name: "X-Frango Bacon", desc: "Frango empanado, bacon crocante, cheddar, alface e tomate.", price: 36.9, category: "Frango", image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Frango" },
  { id: "x-frango-cheddar", name: "X-Frango Cheddar Bacon", desc: "Frango empanado, cheddar cremoso, bacon, alface e maionese verde.", price: 37.9, category: "Frango", image: "https://images.unsplash.com/photo-1606756790138-261d2b21cd75?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Frango", popular: true },
  { id: "x-frango-tudo", name: "X-Frango Tudo", desc: "Frango empanado, queijo, bacon, ovo, alface, tomate, milho e palha.", price: 39.9, category: "Frango", image: "https://images.unsplash.com/photo-1593504049359-74330189a345?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Completo" },
  // --- ESPECIAIS ---
  { id: "x-tudo", name: "X-Tudo", desc: "Carne 180g, queijo duplo, bacon, ovo, alface, tomate, milho, ervilha e batata palha.", price: 39.9, category: "Especiais", image: "/images/x_tudo.jpg", badge: "Especial", popular: true },
  { id: "x-tudo-duplo", name: "X-Tudo Duplo", desc: "2x carne 180g, queijo duplo, bacon, ovo, calabresa, alface, tomate e palha. Gigante.", price: 46.9, category: "Especiais", image: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Especial", popular: true },
  { id: "boka-brabo-m", name: "Boka Brabo", desc: "Blend angus 200g, muçarela, cebola caramelizada, picles e molho brabo picante.", price: 38.9, category: "Especiais", image: "/images/boka_brabo.jpg", badge: "Exclusivo", popular: true },
  { id: "duplo-cheddar", name: "Duplo Cheddar Bacon", desc: "2x carne 180g, cheddar cremoso em dobro, bacon crocante e pão australiano.", price: 44.9, category: "Especiais", image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Especial" },
  // --- DOGS ---
  { id: "dog-prensado", name: "Dog Prensado", desc: "Salsicha, purê, milho, ervilha, batata palha e queijo prensado na chapa.", price: 22.9, category: "Dogs", image: "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Dog" },
  { id: "dog-duplo", name: "Dog Duplo Especial", desc: "2 salsichas, bacon, cheddar, purê, milho, palha e queijo prensado.", price: 28.9, category: "Dogs", image: "https://images.unsplash.com/photo-1627054246067-11e292676b72?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Dog" },
  { id: "dog-calabresa", name: "Dog Calabresa", desc: "Salsicha, calabresa fatiada, purê, vinagrete, palha e queijo.", price: 26.9, category: "Dogs", image: "https://images.unsplash.com/photo-1612392062631-9bde08ae3a1b?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Dog" },
  // --- PORÇÕES / PARRILLA ---
  { id: "batata-p", name: "Batata Frita P", desc: "Batata crocante 300g. Acompanha maionese da casa.", price: 22.9, category: "Porções", image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Porção" },
  { id: "batata-g", name: "Batata G com Cheddar e Bacon", desc: "Batata frita 500g com cheddar cremoso, bacon crocante e cebolinha.", price: 32.9, category: "Porções", image: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Porção", popular: true },
  { id: "batata-recheada", name: "Batata Recheada", desc: "Batata recheada com cheddar, bacon, calabresa e cebolinha. 500g.", price: 36.9, category: "Porções", image: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Porção" },
  { id: "onion-rings", name: "Onion Rings", desc: "Anéis de cebola empanados e crocantes, 300g. Molho barbecue.", price: 24.9, category: "Porções", image: "https://images.unsplash.com/photo-1625938144755-652e08e35997?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Porção" },
  { id: "porcao-calabresa", name: "Calabresa com Fritas", desc: "Calabresa fatiada 300g + fritas 300g + pão e vinagrete.", price: 42.9, category: "Porções", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Porção", popular: true },
  { id: "porcao-frango", name: "Frango a Passarinho", desc: "Frango a passarinho crocante 500g + fritas + molho da casa.", price: 44.9, category: "Porções", image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Porção" },
  { id: "porcao-contrafile", name: "Contra Filé com Fritas", desc: "Contra filé fatiado 400g + fritas 400g + farofa e vinagrete.", price: 62.9, category: "Parrilla", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Parrilla" },
  { id: "porcao-picanha", name: "Picanha na Chapa", desc: "Picanha fatiada 400g + fritas + farofa + pão com alho. Serve 2.", price: 89.9, category: "Parrilla", image: "https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Premium" },
  // --- BEBIDAS ---
  { id: "coca-lata", name: "Coca-Cola Lata 350ml", desc: "Lata gelada, estupidamente gelada.", price: 6.0, category: "Bebidas", image: "https://images.unsplash.com/photo-1624552184280-9e9631bbeee9?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Bebida" },
  { id: "coca-2l", name: "Coca-Cola 2L", desc: "Geladinha para acompanhar. Bem gelada.", price: 12.0, category: "Bebidas", image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Bebida" },
  { id: "guarana-2l", name: "Guaraná Antarctica 2L", desc: "Refrigerante brasileiro clássico.", price: 11.0, category: "Bebidas", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Bebida" },
  { id: "fanta-2l", name: "Fanta Laranja 2L", desc: "Refrigerante laranja gelado.", price: 11.0, category: "Bebidas", image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Bebida" },
  { id: "agua-500", name: "Água Mineral 500ml", desc: "Com ou sem gás.", price: 4.0, category: "Bebidas", image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Bebida" },
  { id: "suco-laranja-500", name: "Suco Natural 500ml", desc: "Laranja, maracujá ou abacaxi. Natural e gelado.", price: 9.9, category: "Bebidas", image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Natural" },
  { id: "milkshake", name: "Milkshake 400ml", desc: "Cremoso e gelado. Sabores: chocolate, morango ou ovomaltine.", price: 16.9, category: "Bebidas", image: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Bebida" },
  { id: "acai-500", name: "Açaí 500ml", desc: "Açaí com banana, granola e leite em pó.", price: 18.9, category: "Sobremesas", image: "https://images.unsplash.com/photo-1488477304112-4944851de03d?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Sobremesa" },
  { id: "cerveja-heineken", name: "Heineken Long Neck 330ml", desc: "Cerveja gelada.", price: 7.5, category: "Bebidas", image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Bebida" },
  // --- COMBOS ---
  { id: "combo-casal", name: "Combo Casal", desc: "2 X-Saladas + batata P + Guaraná 1L. Ideal para dois.", price: 68.9, category: "Combos", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Combo", popular: true },
  { id: "combo-familia", name: "Combo Família", desc: "4 X-Saladas + batata G com cheddar + 2L refrigerante.", price: 129.9, category: "Combos", image: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Combo", popular: true },
  { id: "combo-galera", name: "Combo Galera", desc: "6 X-Saladas + 2 Batatas G + 2x 2L. Para a galera toda.", price: 189.9, category: "Combos", image: "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Combo" },
];

// Ingredientes por produto — para modal de customização (corresponde à imagem real)
const PRODUCT_INGREDIENTS = {
  "x-mignon": ["pão brioche", "filé mignon 180g", "queijo muçarela", "bacon crocante", "alface", "tomate", "molho da casa"],
  "x-salada": ["pão brioche", "carne 180g", "queijo", "alface", "tomate", "milho", "ervilha", "batata palha"],
  "x-burguer": ["pão brioche", "carne 180g", "queijo cheddar", "maionese da casa"],
  "x-egg": ["pão brioche", "carne 180g", "queijo", "ovo frito", "alface", "tomate"],
  "x-bacon": ["pão brioche", "carne 180g", "cheddar cremoso", "bacon", "alface", "tomate", "maionese"],
  "x-calabresa": ["pão brioche", "carne 180g", "calabresa fatiada", "queijo", "vinagrete", "maionese verde"],
  "bauru": ["pão francês", "presunto", "muçarela", "tomate", "alface", "orégano"],
  "x-frango": ["pão brioche", "filé de frango 150g empanado", "queijo", "alface", "tomate", "molho especial"],
  "x-frango-bacon": ["pão brioche", "frango empanado", "bacon", "cheddar", "alface", "tomate"],
  "x-tudo": ["pão brioche", "carne 180g", "queijo duplo", "bacon", "ovo", "alface", "tomate", "milho", "palha"],
  "x-tudo-duplo": ["pão australiano", "2x carne 180g", "queijo duplo", "bacon", "ovo", "calabresa", "alface", "tomate", "palha"],
  "boka-brabo-m": ["pão brioche", "angus 200g", "muçarela", "cebola caramelizada", "picles", "molho brabo"],
  "duplo-cheddar": ["pão australiano", "2x carne 180g", "cheddar duplo", "bacon", "maionese"],
  "dog-prensado": ["pão de hot dog", "salsicha", "purê", "milho", "ervilha", "batata palha", "queijo"],
  "dog-duplo": ["pão hot dog", "2 salsichas", "bacon", "cheddar", "purê", "milho", "palha", "queijo"],
  "batata-p": ["batata frita 300g", "maionese da casa"],
  "batata-g": ["batata 500g", "cheddar cremoso", "bacon crocante", "cebolinha"],
  "batata-recheada": ["batata 500g", "cheddar", "bacon", "calabresa", "cebolinha"],
  "onion-rings": ["anéis de cebola 300g", "molho barbecue"],
  "porcao-calabresa": ["calabresa 300g", "fritas 300g", "pão", "vinagrete"],
  "porcao-frango": ["frango a passarinho 500g", "fritas", "molho da casa"],
  "porcao-contrafile": ["contra filé 400g", "fritas 400g", "farofa", "vinagrete"],
  "porcao-picanha": ["picanha 400g", "fritas", "farofa", "pão com alho"],
  "coca-lata": ["Coca-Cola lata 350ml gelada"],
  "coca-2l": ["Coca-Cola 2L gelada"],
  "guarana-2l": ["Guaraná Antarctica 2L"],
  "fanta-2l": ["Fanta Laranja 2L"],
  "agua-500": ["água mineral 500ml"],
  "suco-laranja-500": ["suco natural 500ml (laranja/maracujá/abacaxi)"],
  "milkshake": ["leite", "sorvete", "calda (chocolate/morango/ovomaltine)"],
  "acai-500": ["açaí 500ml", "banana", "granola", "leite em pó"],
  "cerveja-heineken": ["Heineken long neck 330ml gelada"],
  "combo-casal": ["2x X-Salada", "batata P", "Guaraná 1L"],
  "combo-familia": ["4x X-Salada", "batata G cheddar", "refrigerante 2L"],
  "combo-galera": ["6x X-Salada", "2x batata G", "2x refrigerante 2L"],
  // novos clássicos/especiais
  "x-coracao": ["pão brioche", "coração de frango 150g", "queijo", "alface", "tomate", "maionese"],
  "x-picanha": ["pão brioche", "picanha 200g", "queijo", "alface", "tomate", "molho verde"],
  "x-alcatra": ["pão brioche", "alcatra 180g", "queijo", "bacon", "ovo", "alface", "tomate"],
  "bauru-forno": ["pão francês", "presunto", "muçarela", "tomate", "orégano", "recheio cremoso"],
  "misto-quente": ["pão de forma", "presunto", "muçarela", "manteiga"],
  "x-egg-bacon-duplo": ["pão australiano", "2x carne 180g", "queijo duplo", "2 ovos", "bacon", "alface", "tomate"],
  "bauru-duplo": ["pão francês", "2x presunto", "2x muçarela", "tomate", "alface", "orégano"],
  "x-frango-cheddar": ["pão brioche", "frango empanado", "cheddar", "bacon", "alface"],
  "x-frango-tudo": ["pão brioche", "frango empanado", "queijo", "bacon", "ovo", "alface", "tomate", "milho", "palha"],
  "dog-calabresa": ["pão hot dog", "salsicha", "calabresa", "purê", "vinagrete", "palha", "queijo"],
};

const EXTRAS_CATALOG = [
  { id: "bacon", name: "Bacon extra", price: 4.0 },
  { id: "cheddar", name: "Cheddar extra", price: 3.0 },
  { id: "egg", name: "Ovo", price: 2.5 },
  { id: "palha", name: "Batata palha extra", price: 2.0 },
  { id: "maionese", name: "Maionese da casa extra", price: 1.5 },
  { id: "queijo", name: "Queijo extra", price: 3.5 },
];

function useOpenStatus(openHour = OPEN_HOUR, closeHour = CLOSE_HOUR) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const isOpen = useMemo(() => {
    const h = now.getHours();
    const close = closeHour === 0 ? 24 : closeHour;
    if (close > openHour) return h >= openHour && h < close;
    return h >= openHour || h < close;
  }, [now, openHour, closeHour]);
  const label = isOpen ? "Aberto agora" : "Fechado no momento";
  const closeLabel = closeHour === 0 ? "00h" : `${String(closeHour).padStart(2, "0")}h`;
  const detail = isOpen ? `Até ${closeLabel}` : `Abre às ${String(openHour).padStart(2, "0")}h`;
  const nextOpen = `Todos os dias das ${openHour}h às ${closeLabel}`;
  return { isOpen, label, detail, nextOpen, now };
}

export default function App() {
  const [activeFlavor, setActiveFlavor] = useState(0);
  const [direction, setDirection] = useState(1);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [addedPulse, setAddedPulse] = useState(false);
  const [toast, setToast] = useState(null);
  const [category, setCategory] = useState("Todos");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalQty, setModalQty] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [removedIngredients, setRemovedIngredients] = useState([]);
  const [observation, setObservation] = useState("");
  // checkout direto no site
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState("form"); // form | pix | success
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "", cpf: "" });
  const [currentOrder, setCurrentOrder] = useState(null);
  const [verifyingPix, setVerifyingPix] = useState(false);
  const [orderError, setOrderError] = useState(null);
  // dynamic store
  const [dynProducts, setDynProducts] = useState(() => {
    try { const p = getProducts(); return Array.isArray(p) && p.length ? p : DEFAULT_PRODUCTS; } catch { return DEFAULT_PRODUCTS; }
  });
  const [dynSettings, setDynSettings] = useState(() => {
    try { return getSettings(); } catch { return null; }
  });
  const [dynDiscounts, setDynDiscounts] = useState(() => {
    try { return getDiscounts(); } catch { return []; }
  });
  useEffect(() => {
    const h = () => {
      try { setDynProducts(getProducts()); } catch {}
      try { setDynSettings(getSettings()); } catch {}
      try { setDynDiscounts(getDiscounts()); } catch {}
    };
    window.addEventListener("boka:products", h);
    window.addEventListener("boka:settings", h);
    window.addEventListener("boka:discounts", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("boka:products", h);
      window.removeEventListener("boka:settings", h);
      window.removeEventListener("boka:discounts", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  useEffect(() => {
    hydrateFromSql().then(() => {
      try { setDynProducts(getProducts()); } catch {}
      try { setDynSettings(getSettings()); } catch {}
      try { setDynDiscounts(getDiscounts()); } catch {}
    }).catch(()=>{});
  }, []);
  // polling fallback para horario/logo refletir mesmo entre abas (storage event nem sempre dispara)
  useEffect(() => {
    const id = setInterval(() => {
      try {
        const s = getSettings();
        // só atualiza se mudou
        const cur = JSON.stringify(s);
        const prev = JSON.stringify(dynSettings);
        if (cur !== prev) setDynSettings(s);
      } catch {}
    }, 1000);
    const onVis = () => { try { setDynSettings(getSettings()); } catch {} };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); window.removeEventListener("focus", onVis); };
  }, [dynSettings]);

  const EFFECTIVE_PRODUCTS = dynProducts && dynProducts.length ? dynProducts : MENU_PRODUCTS;
  const SETTINGS_RAW = dynSettings || { address: ADDRESS, gmapsLink: GMAPS_LINK, phoneDisplay: PHONE_DISPLAY, phoneTel: PHONE_TEL, whatsappNumber: WHATSAPP_NUMBER, instagramUrl: INSTAGRAM_URL, ifoodUrl: IFOOD_URL, logo: "/logo-nova.avif", openHour: OPEN_HOUR, closeHour: CLOSE_HOUR };
  const SETTINGS = {
    ...SETTINGS_RAW,
    whatsappNumber: (SETTINGS_RAW.whatsappNumber || "").replace(/\D/g,"") || WHATSAPP_NUMBER,
    phoneTel: SETTINGS_RAW.phoneTel || PHONE_TEL,
    address: SETTINGS_RAW.address || ADDRESS,
    gmapsLink: SETTINGS_RAW.gmapsLink || GMAPS_LINK,
    logo: SETTINGS_RAW.logo || "/logo-nova.avif",
    openHour: SETTINGS_RAW.openHour ?? OPEN_HOUR,
    closeHour: SETTINGS_RAW.closeHour ?? CLOSE_HOUR,
  };
  const GMAPS_LINK_DYN = SETTINGS.gmapsLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SETTINGS.address)}`;
  const GMAPS_EMBED_DYN = `https://maps.google.com/maps?q=${encodeURIComponent(SETTINGS.address)}&t=&z=17&ie=UTF8&iwloc=&output=embed`;
  // helper for discounted price
  const getDisplayPrice = (product) => {
    try { return getDiscountedPrice(product, dynDiscounts); } catch { return product.price; }
  };
  const { isOpen, label, detail } = useOpenStatus(SETTINGS.openHour, SETTINGS.closeHour);

  const categories = ["Todos", ...Array.from(new Set(EFFECTIVE_PRODUCTS.map((p) => p.category)))];
  const filteredMenu = useMemo(() => (category === "Todos" ? EFFECTIVE_PRODUCTS : EFFECTIVE_PRODUCTS.filter((p) => p.category === category)), [category, EFFECTIVE_PRODUCTS]);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = useMemo(() => cart.reduce((sum, item) => {
    const prod = EFFECTIVE_PRODUCTS.find((p) => p.id === item.id);
    if (!prod) return sum;
    const extra = item.extrasPrice || 0;
    const unit = getDisplayPrice(prod) + extra;
    return sum + unit * item.qty;
  }, 0), [cart, EFFECTIVE_PRODUCTS, dynDiscounts]);

  useEffect(() => {
    const id = setInterval(() => {
      setDirection(1);
      setActiveFlavor((prev) => (prev + 1) % HERO_FLAVORS.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const goToFlavor = (idx) => {
    if (idx === activeFlavor) return;
    setDirection(idx > activeFlavor ? 1 : -1);
    setActiveFlavor(idx);
  };

  const addToCart = (id) => {
    setCart((prev) => {
      const found = prev.find((p) => p.id === id && !p.extras?.length && !p.observation && !p.removed?.length);
      if (found) return prev.map((p) => (p.id === id && !p.extras?.length && !p.observation && !p.removed?.length ? { ...p, qty: p.qty + 1 } : p));
      return [...prev, { id, qty: 1, extras: [], observation: "", removed: [] }];
    });
    setAddedPulse(true);
    const prod = EFFECTIVE_PRODUCTS.find((p) => p.id === id);
    setToast(`${prod?.name} adicionado!`);
    setTimeout(() => setAddedPulse(false), 650);
    setTimeout(() => setToast(null), 2200);
  };

  const openProductModal = (product) => {
    setSelectedProduct(product);
    setModalQty(1);
    setSelectedExtras([]);
    setRemovedIngredients([]);
    setObservation("");
  };

  const closeProductModal = () => setSelectedProduct(null);

  const toggleExtra = (extraId) => {
    setSelectedExtras((prev) => (prev.includes(extraId) ? prev.filter((e) => e !== extraId) : [...prev, extraId]));
  };

  const toggleIngredient = (ing) => {
    setRemovedIngredients((prev) => (prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]));
  };

  const confirmAddToCart = () => {
    if (!selectedProduct) return;
    const extrasPrice = selectedExtras.reduce((s, id) => {
      const e = EXTRAS_CATALOG.find((x) => x.id === id);
      return s + (e ? e.price : 0);
    }, 0);
    const basePrice = getDisplayPrice(selectedProduct);
    const itemTotal = (basePrice + extrasPrice) * modalQty;
    setCart((prev) => [...prev, { id: selectedProduct.id, qty: modalQty, extras: [...selectedExtras], removed: [...removedIngredients], observation, extrasPrice, itemTotal }]);
    setAddedPulse(true);
    setToast(`${modalQty}x ${selectedProduct.name} adicionado!`);
    setTimeout(() => setAddedPulse(false), 650);
    setTimeout(() => setToast(null), 2200);
    closeProductModal();
  };
  const updateQty = (id, qty) => {
    if (qty <= 0) setCart((prev) => prev.filter((p) => p.id !== id));
    else setCart((prev) => prev.map((p) => (p.id === id ? { ...p, qty } : p)));
  };
  const removeItem = (id) => setCart((prev) => prev.filter((p) => p.id !== id));
  const removeByIndex = (idx) => setCart((prev) => prev.filter((_, i) => i !== idx));
  const updateQtyByIndex = (idx, qty) => {
    if (qty <= 0) setCart((prev) => prev.filter((_, i) => i !== idx));
    else setCart((prev) => prev.map((p, i) => {
      if (i !== idx) return p;
      const prod = EFFECTIVE_PRODUCTS.find((x) => x.id === p.id);
      const unit = prod ? getDisplayPrice(prod) + (p.extrasPrice || 0) : (p.extrasPrice || 0);
      return { ...p, qty, itemTotal: unit * qty };
    }));
  };
  const formatBRL = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // gera link do whatsapp com carrinho se existir, senão mensagem padrão - usado em todos os botões "Chamar no WhatsApp"
  const getWhatsAppHref = () => {
    const rawNumber = (SETTINGS.whatsappNumber || WHATSAPP_NUMBER || "").replace(/\D/g, "") || WHATSAPP_NUMBER.replace(/\D/g,"");
    if (cart.length > 0) {
      const lines = cart.map((item) => {
        const prod = EFFECTIVE_PRODUCTS.find((p) => p.id === item.id);
        if (!prod) return "";
        const base = `• ${item.qty}x ${prod.name} — ${formatBRL((getDisplayPrice(prod) + (item.extrasPrice || 0)) * item.qty)}`;
        const extras = item.extras?.length ? `\n  + ${item.extras.map((id) => EXTRAS_CATALOG.find((e) => e.id === id)?.name).join(", ")}` : "";
        const removed = item.removed?.length ? `\n  - sem: ${item.removed.join(", ")}` : "";
        const obs = item.observation ? `\n  obs: ${item.observation}` : "";
        return base + extras + removed + obs;
      }).join("\n");
      const total = formatBRL(cartTotal);
      const payLabel = paymentMethod === "pix" ? "Pix" : paymentMethod === "card" ? "Cartão" : paymentMethod === "money" ? "Dinheiro" : "Pix";
      const msgRaw = `Olá! Quero fazer um pedido na *Boka Loka Lanches*:\n\n${lines}\n\n*Total: ${total}*\n*Pagamento: ${payLabel}*\n\nPode confirmar meu pedido? 🍔`;
      return `https://wa.me/${rawNumber}?text=${encodeURIComponent(msgRaw)}`;
    }
    return `https://wa.me/${rawNumber}?text=${encodeURIComponent("Olá! Gostaria de fazer um pedido na Boka Loka Lanches 🍔")}`;
  };

  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) {
      setToast("Seu carrinho está vazio!");
      setTimeout(() => setToast(null), 2000);
      return;
    }
    const rawNumber = (SETTINGS.whatsappNumber || WHATSAPP_NUMBER || "").replace(/\D/g, "") || WHATSAPP_NUMBER.replace(/\D/g,"");
    const lines = cart.map((item) => {
      const prod = EFFECTIVE_PRODUCTS.find((p) => p.id === item.id);
      if (!prod) return "";
      const base = `• ${item.qty}x ${prod.name} — ${formatBRL((getDisplayPrice(prod) + (item.extrasPrice || 0)) * item.qty)}`;
      const extras = item.extras?.length ? `\n  + ${item.extras.map((id) => EXTRAS_CATALOG.find((e) => e.id === id)?.name).join(", ")}` : "";
      const removed = item.removed?.length ? `\n  - sem: ${item.removed.join(", ")}` : "";
      const obs = item.observation ? `\n  obs: ${item.observation}` : "";
      return base + extras + removed + obs;
    }).join("\n");
    const total = formatBRL(cartTotal);
    const payLabel = paymentMethod === "pix" ? "Pix" : paymentMethod === "card" ? "Cartão" : paymentMethod === "money" ? "Dinheiro" : "Pix";
    const msgRaw = `Olá! Quero fazer um pedido na *Boka Loka Lanches*:\n\n${lines}\n\n*Total: ${total}*\n*Pagamento: ${payLabel}*\n\nPode confirmar meu pedido? 🍔`;
    const msg = encodeURIComponent(msgRaw);
    const url = `https://wa.me/${rawNumber}?text=${msg}`;
    const win = window.open(url, "_blank");
    if (!win) {
      window.location.href = url;
    }
  };

  // ===== CHECKOUT DIRETO NO SITE (com verificação PIX) =====
  const handleOpenSiteCheckout = () => {
    if (cart.length === 0) {
      setToast("Seu carrinho está vazio!");
      setTimeout(()=>setToast(null), 2000);
      return;
    }
    setOrderError(null);
    setCheckoutStep("form");
    setIsCheckoutOpen(true);
  };
  const handleCreateOrder = async () => {
    if (!customer.name.trim() || !customer.phone.trim()) {
      setOrderError("Informe nome e telefone/WhatsApp");
      return;
    }
    if (!customer.address.trim()) {
      setOrderError("Informe endereço para entrega");
      return;
    }
    if (customer.cpf && customer.cpf.replace(/\D/g,"").length !== 11) {
      setOrderError("CPF deve ter 11 dígitos (ou deixe em branco)");
      return;
    }
    setOrderError(null);
    try {
      setVerifyingPix(true);
      const orderItems = cart.map(item => {
        const prod = EFFECTIVE_PRODUCTS.find(p=>p.id===item.id);
        return {
          id: item.id,
          name: prod ? prod.name : item.id,
          qty: item.qty,
          price: prod ? getDisplayPrice(prod) : 0,
          extras: item.extras || [],
          extrasPrice: item.extrasPrice || 0,
          removed: item.removed || [],
          observation: item.observation || "",
        };
      });
      const payload = {
        customerName: customer.name.trim(),
        customerPhone: customer.phone.trim(),
        customerAddress: customer.address.trim(),
        customerCpf: customer.cpf.trim(),
        items: orderItems,
        total: cartTotal,
        paymentMethod,
      };
      const order = await createOrder(payload);
      setCurrentOrder(order);
      if (paymentMethod === "pix") {
        setCheckoutStep("pix");
        setToast("Pedido criado! Pague o PIX e clique em Verificar");
        setTimeout(()=>setToast(null), 3000);
      } else {
        // cartão/dinheiro entra como pending - admin confirma
        setCheckoutStep("success");
        setCart([]);
        setToast(`Pedido #${order.id.slice(0,6).toUpperCase()} criado! Aguardando confirmação.`);
        setTimeout(()=>setToast(null), 3500);
      }
    } catch (e) {
      setOrderError(e.message || "Erro ao criar pedido");
    } finally {
      setVerifyingPix(false);
    }
  };
  const handleVerifyPix = async (force=false) => {
    if (!currentOrder) return;
    setVerifyingPix(true);
    setOrderError(null);
    try {
      const res = await verifyPixOrder(currentOrder.id, force);
      if (res?.verified || res?.status==="paid" || res?.status==="confirmed") {
        setCurrentOrder(res);
        setCheckoutStep("success");
        setCart([]);
        setToast("✅ PIX confirmado! Pedido em preparo.");
        setTimeout(()=>setToast(null), 3000);
      } else {
        setOrderError(res?.message || "PIX ainda não pago. Pague e tente novamente em alguns segundos.");
        // atualiza order local com status
        if (res) setCurrentOrder(res);
      }
    } catch (e) {
      setOrderError(e.message || "Erro ao verificar PIX");
    } finally {
      setVerifyingPix(false);
    }
  };
  // polling automático PIX a cada 7s
  useEffect(() => {
    if (checkoutStep !== "pix" || !currentOrder || currentOrder.status==="paid" || currentOrder.status==="confirmed") return;
    const id = setInterval(()=> { handleVerifyPix(false); }, 7000);
    return ()=> clearInterval(id);
  }, [checkoutStep, currentOrder]);

  const handleCall = () => {
    const tel = SETTINGS.phoneTel || PHONE_TEL;
    window.location.href = `tel:${tel}`;
  };

  const handleSaveContact = () => {
    const wa = (SETTINGS.whatsappNumber || WHATSAPP_NUMBER).replace(/\D/g,"") || WHATSAPP_NUMBER.replace(/\D/g,"");
    const tel = SETTINGS.phoneTel || PHONE_TEL;
    const vcard = [
      "BEGIN:VCARD", "VERSION:3.0", "FN:Boka Loka Lanches", "ORG:Boka Loka Lanches",
      `TEL;TYPE=CELL,VOICE:${wa}`, `TEL;TYPE=WORK,VOICE:${tel}`,
      `ADR;TYPE=WORK:;;${SETTINGS.address || ADDRESS};;;;`, `URL:${SETTINGS.instagramUrl || INSTAGRAM_URL}`,
      `NOTE:Hamburgueria em Tubarao/SC — Todos os dias ${String(SETTINGS.openHour).padStart(2,"0")}h as ${SETTINGS.closeHour===0?"00":String(SETTINGS.closeHour).padStart(2,"0")}h`,
      "END:VCARD",
    ].join("\r\n");
    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "boka-loka-lanches.vcf";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    setToast("Contato salvo! Verifique seus downloads.");
    setTimeout(() => setToast(null), 2500);
  };

  const scrollToMenu = () => document.getElementById("cardapio")?.scrollIntoView({ behavior: "smooth" });
  const currentFlavor = HERO_FLAVORS[activeFlavor];

  return (
    <div className="min-h-screen bg-[#fffbf0] text-zinc-900 selection:bg-[#e30613] selection:text-white">
      {/* HEADER — adulto, limpo, branco + vermelho/amarelo */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-zinc-200 bg-white/80 glass-white">
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <a href="#" className="group flex items-center gap-3">
            <img
              src={SETTINGS.logo}
              alt="Boka Loka Lanches - Tubarão/SC"
              className="h-11 w-auto rounded-xl object-contain shadow-[0_4px_14px_rgba(0,0,0,0.12)] ring-1 ring-zinc-200"
              onError={(e) => { e.currentTarget.style.display='none'; const fb = e.currentTarget.nextElementSibling; if (fb) fb.style.display='grid'; }}
            />
            <div className="hidden h-11 w-11 place-items-center overflow-hidden rounded-xl bg-[#CF0C19] shadow-[0_6px_20px_rgba(207,12,25,0.25)]" style={{display:'none'}}>
              <span className="font-display text-[18px] font-black leading-none tracking-[-0.02em] text-white">BL</span>
            </div>
            <span className={`ml-1 hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold sm:inline-flex ${isOpen ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-zinc-200 bg-zinc-50 text-zinc-500"}`}>
              <span className={`h-2 w-2 animate-pulse rounded-full ${isOpen ? "bg-emerald-500" : "bg-zinc-400"}`} />
              {label}
            </span>
          </a>

          <nav className="hidden items-center gap-1 text-[13.5px] font-semibold tracking-wide lg:flex">
            {[
              { label: "Início", href: "#inicio" },
              { label: "Sobre", href: "#sobre" },
              { label: "Cardápio", href: "#cardapio" },
              { label: "Localização", href: "#localizacao" },
            ].map((l) => (
              <a key={l.label} href={l.href} className="rounded-full px-4 py-2 text-zinc-600 transition hover:bg-zinc-900 hover:text-white">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a href={SETTINGS.ifoodUrl} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-extrabold text-[#ea1d2c] ring-1 ring-zinc-200 transition hover:bg-zinc-900 hover:text-white hover:ring-zinc-900 sm:inline-flex">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[#ea1d2c] text-[10px] font-black text-white">iF</span>
              iFood
            </a>
            <a href={`tel:${SETTINGS.phoneTel}`} className="hidden h-11 w-11 place-items-center rounded-full bg-white text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-900 hover:text-white hover:ring-zinc-900 sm:grid">
              <Phone className="h-4 w-4" />
            </a>
            <button onClick={() => setIsCartOpen(true)} className={`relative grid h-11 w-11 place-items-center rounded-full bg-zinc-900 text-white transition active:scale-95 ${addedPulse ? "animate-[bounce_0.45s]" : ""} hover:bg-black`}>
              <ShoppingBag className="h-[18px] w-[18px]" />
              <AnimatePresence>{cartCount > 0 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#e30613] px-1 text-[11px] font-black leading-none text-white shadow-lg">{cartCount}</motion.span>}</AnimatePresence>
            </button>
            <a href={getWhatsAppHref()} target="_blank" rel="noopener noreferrer" className="hidden h-11 items-center gap-2 rounded-full bg-[#25d366] px-6 text-[13.5px] font-extrabold text-white shadow-[0_8px_24px_rgba(37,211,102,0.28)] transition hover:brightness-110 active:scale-[0.98] sm:inline-flex">
              <MessageCircle className="h-4 w-4 fill-white" />
              Pedir agora
            </a>
            <button onClick={() => setIsMenuOpen((v) => !v)} className="grid h-11 w-11 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-900 lg:hidden" aria-label="Menu">
              {isMenuOpen ? <X className="h-5 w-5" /> : <AlignJustify className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-zinc-200 bg-white lg:hidden">
              <div className="space-y-1 px-4 py-4">
                {[
                  { label: "Início", href: "#inicio" }, { label: "Sobre", href: "#sobre" }, { label: "Cardápio", href: "#cardapio" }, { label: "Localização", href: "#localizacao" },
                ].map((l) => (
                  <a key={l.label} href={l.href} onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between rounded-xl px-4 py-3 text-[15px] font-semibold text-zinc-700 hover:bg-zinc-100">
                    {l.label} <ChevronRight className="h-4 w-4 opacity-40" />
                  </a>
                ))}
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <a href={SETTINGS.ifoodUrl} target="_blank" rel="noopener noreferrer" className="grid place-items-center rounded-full bg-zinc-900 py-3 text-sm font-black text-white">Pedir no iFood</a>
                  <a href={getWhatsAppHref()} target="_blank" rel="noopener noreferrer" className="grid place-items-center rounded-full bg-[#e30613] py-3 text-sm font-black text-white">WhatsApp</a>
                </div>
                <div className="flex items-center justify-center gap-2 pt-3 text-xs text-zinc-500">
                  <span className={`h-2 w-2 rounded-full ${isOpen ? "bg-emerald-500" : "bg-zinc-400"}`} />
                  {label} • {detail}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HERO — CÓPIA EXATA DA IMAGEM 1: TUBARÃO,SC + BOKA LOKA + CARD DESLIZANTE */}
      <section id="inicio" className="relative overflow-hidden bg-[#fffcf5] pt-[72px]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-[520px] w-[700px] bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.9),_transparent_70%)]" />
          <div className="absolute left-0 top-[120px] h-[380px] w-[420px] rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(255,195,0,0.10),_transparent_70%)] blur-[20px]" />
          <img src="https://img02.restaurantguru.com/cbd3-Boka-Loka-Lanches-Tubarao-burger.jpg" alt="" className="absolute right-[-6%] top-[6%] h-[82%] w-[58%] object-cover opacity-[0.07] grayscale" />
        </div>

        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            {/* ESQUERDA — IGUAL AO PRINT */}
            <div className="relative z-10">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-1.5 rounded-full border border-[#e30613]/15 bg-[#fff1f1] px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#e30613]" />
                <span className="text-[11px] font-black tracking-[0.12em] text-[#e30613]">TUBARÃO, SC</span>
              </motion.div>

              <h1 className="mt-4 font-display text-[56px] font-black leading-[0.88] tracking-[-0.04em] sm:text-[64px] lg:text-[72px]">
                <span className="block text-[#e30613]">BOKA</span>
                <span className="block text-zinc-900">LOKA</span>
              </h1>

              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }} className="mt-4 max-w-[420px] text-[15px] font-medium leading-relaxed text-zinc-600">
                Simples, bom e ponto. O lanche tradicional de Tubarão.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }} className="mt-6 flex flex-wrap items-center gap-3">
                <button onClick={scrollToMenu} className="inline-flex items-center gap-2 rounded-full bg-[#e30613] px-6 py-3.5 text-[13px] font-black tracking-wide text-white shadow-[0_8px_24px_rgba(227,6,19,0.28)] transition hover:bg-[#b8050f] active:scale-[0.98]">
                  <ShoppingBag className="h-4 w-4" />
                  FAZER PEDIDO
                </button>
                <a href={getWhatsAppHref()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-[13px] font-black tracking-wide text-zinc-800 ring-1 ring-zinc-300 transition hover:bg-zinc-900 hover:text-white hover:ring-zinc-900 active:scale-[0.98]">
                  <MessageCircle className="h-4 w-4" />
                  VER NO WHATSAPP
                </a>
              </motion.div>

              <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.5 }} onClick={handleSaveContact} className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#ffc300]/50 bg-[#fff9d6] px-4 py-2 text-[11px] font-black tracking-[0.08em] text-[#a16207] transition hover:bg-[#ffc300] hover:text-zinc-900 active:scale-[0.98]">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-[#ffc300] text-white"><Plus className="h-3 w-3 text-zinc-900" /></span>
                SALVAR CONTATO
              </motion.button>
            </div>

            {/* DIREITA — CARD DESLIZANTE IGUAL AO PRINT */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[380px]">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentFlavor.id}
                    custom={direction}
                    initial={{ x: direction * 90, opacity: 0, scale: 0.96 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    exit={{ x: -direction * 90, opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden rounded-[24px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.14)] ring-1 ring-zinc-200"
                  >
                    <div className="relative h-[300px] overflow-hidden bg-zinc-100 sm:h-[360px]">
                      <img src={currentFlavor.image} alt={currentFlavor.name} onError={(e)=>{e.currentTarget.src="https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?w=800&q=80&auto=format&fit=crop";}} className="h-full w-full object-cover" loading="eager" />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
                      <span className="absolute left-3 top-3 rounded-full bg-[#e30613] px-3 py-1 text-[11px] font-black tracking-wide text-white shadow">{currentFlavor.badge}</span>
                    </div>
                    <div className="p-5">
                      <div className="font-display text-[22px] font-black tracking-[-0.02em] text-zinc-900">{currentFlavor.name}</div>
                      <div className="mt-1 text-[13px] font-medium leading-snug text-zinc-500">{currentFlavor.description}</div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="font-display text-[22px] font-black leading-none text-[#e30613]">{formatBRL(currentFlavor.price)}</div>
                        <button onClick={() => { const p = EFFECTIVE_PRODUCTS.find((x) => x.id === currentFlavor.id); if (p) openProductModal(p); else addToCart(currentFlavor.id); }} className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-5 py-2 text-[12px] font-black text-white hover:bg-black active:scale-95">
                          <Plus className="h-3.5 w-3.5" />
                          PEDIR
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* dots exatamente como no print: 4 pontos, ativo vermelho alongado */}
                <div className="mt-4 flex items-center justify-center gap-1.5">
                  {HERO_FLAVORS.map((_, i) => (
                    <button key={i} onClick={() => goToFlavor(i)} aria-label={`Ver sabor ${i + 1}`} className={`h-2 rounded-full transition-all ${i === activeFlavor ? "w-6 bg-[#e30613]" : "w-2 bg-zinc-300 hover:bg-zinc-400"}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOBRE — adulto, editorial */}
      <section id="sobre" className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(227,6,19,0.06),_transparent_60%)]" />
        <div className="relative mx-auto max-w-[1280px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.95fr] lg:items-start lg:gap-12">
            <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-black tracking-[0.14em] text-zinc-700"><Heart className="h-3.5 w-3.5 text-[#e30613]" />NOSSA HISTÓRIA</div>
              <h2 className="mt-4 font-display text-[36px] font-black leading-[0.95] tracking-[-0.03em] text-zinc-900 sm:text-[44px] lg:text-[48px]">FEITO COM<br /><span className="text-[#e30613]">FOME</span> E CORAÇÃO</h2>
              <p className="mt-4 max-w-[560px] text-[15.5px] font-medium leading-relaxed text-zinc-600">Nossos lanches são uma amostra de sabores e criatividade. Prezamos pela qualidade e ótimos sabores — do pão brioche macio à carne 180g suculenta, cada detalhe é pensado para te deixar <span className="font-black text-zinc-900">loko</span> de vontade de repetir.</p>
              <p className="mt-3 max-w-[560px] text-[14px] leading-relaxed text-zinc-500">No coração de Tubarão, na Av. Pedro Zapelini, atendemos todos os dias a partir das 18h com entrega rápida, retirada e também pelo iFood. Mais de 1.600 clientes já avaliaram e aprovaram.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-bold text-white"><Check className="h-4 w-4 rounded-full bg-emerald-500 p-0.5 text-white" />Ingredientes frescos diariamente</div>
                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700">Pão e carnes selecionadas</div>
              </div>
            </motion.div>
            <div className="hidden lg:block" />
          </div>
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-10 grid grid-cols-2 gap-3 rounded-[20px] border border-zinc-200 bg-zinc-50 p-3 sm:grid-cols-4">
            {[{ k: "1.6k+", v: "avaliações" }, { k: "4.6★", v: "nota média" }, { k: `${String(SETTINGS.openHour).padStart(2,"0")}h–${SETTINGS.closeHour===0?"00":String(SETTINGS.closeHour).padStart(2,"0")}h`, v: "todos os dias" }, { k: "Centro", v: "Tubarão/SC" }].map((s) => (
              <div key={s.k} className="rounded-2xl bg-white px-4 py-4 text-center ring-1 ring-zinc-200"><div className="font-display text-[22px] font-black leading-none tracking-[-0.02em] text-zinc-900">{s.k}</div><div className="mt-1 text-[11px] font-bold tracking-[0.12em] text-zinc-500">{s.v.toUpperCase()}</div></div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CARDÁPIO — fotos profissionais, sem placeholder genérico */}
      <section id="cardapio" className="relative bg-[#fffbf0] py-12 sm:py-16 lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(227,6,19,0.04),_transparent_55%)]" />
        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-black tracking-[0.14em] text-white"><Utensils className="h-3.5 w-3.5" />CARDÁPIO COMPLETO</div>
              <h2 className="mt-3 font-display text-[36px] font-black leading-[0.92] tracking-[-0.03em] text-zinc-900 sm:text-[44px]">ESCOLHA SEU<br /><span className="text-[#e30613]">FAVORITO</span></h2>
              <p className="mt-2 max-w-[520px] text-[13.5px] font-medium leading-relaxed text-zinc-600">Fotos vida real — sem estúdio, como sai da chapa. <span className="font-bold text-zinc-900">Registro real Boka Loka.</span></p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs font-bold tracking-[0.12em] text-zinc-500 sm:inline">FILTRAR:</span>
              <div className="flex max-w-[86vw] items-center gap-1.5 overflow-x-auto rounded-full border border-zinc-200 bg-white p-1 shadow-sm sm:max-w-none">
                {categories.map((c) => (
                  <button key={c} onClick={() => setCategory(c)} className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-bold transition ${category === c ? "bg-zinc-900 text-white shadow" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"}`}>{c}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMenu.map((prod, idx) => (
              <motion.div key={prod.id} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ delay: (idx % 4) * 0.06, duration: 0.45 }} whileHover={{ y: -4 }} className="group relative flex flex-col overflow-hidden rounded-[22px] border border-zinc-200 bg-white transition hover:border-zinc-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
                <div className="relative h-[200px] overflow-hidden bg-zinc-100">
                  <img src={prod.image} alt={prod.name} loading="lazy" onError={(e)=>{e.currentTarget.src="https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?w=800&q=80&auto=format&fit=crop";}} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.06]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-transparent" />
                  <div className="absolute left-3 top-3 flex items-center gap-1.5">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black tracking-[0.08em] ${prod.badge === "Confirmado" ? "bg-emerald-500 text-white" : prod.popular ? "bg-[#e30613] text-white" : "bg-white/95 text-zinc-900 ring-1 ring-zinc-200"}`}>{prod.badge?.toUpperCase()}</span>
                    {prod.popular && <span className="inline-flex items-center gap-1 rounded-full bg-[#ffc300] px-2.5 py-1 text-[10px] font-black text-zinc-900"><Flame className="h-3 w-3" />POPULAR</span>}
                  </div>
                  {(() => { const disc = getDisplayPrice(prod); const hasDisc = disc < prod.price; return <div className={`absolute bottom-3 right-3 rounded-full px-3 py-1.5 font-display text-[16px] font-black leading-none shadow-lg ring-1 ${hasDisc ? "bg-[#e30613] text-white ring-[#e30613]" : "bg-white text-zinc-900 ring-zinc-200"}`}>{formatBRL(disc)}{hasDisc && <span className="ml-1 text-[10px] font-bold line-through opacity-80">{formatBRL(prod.price)}</span>}</div>; })()}
                  <button onClick={() => openProductModal(prod)} className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-zinc-900 opacity-0 shadow-xl ring-1 ring-zinc-200 transition group-hover:opacity-100 hover:scale-105 active:scale-95" aria-label={`Ver ${prod.name}`}><Plus className="h-5 w-5" /></button>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-[16px] font-black leading-[1.05] tracking-[-0.02em] text-zinc-900">{prod.name}</h3>
                    <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-bold tracking-wide text-zinc-600 ring-1 ring-zinc-200">{prod.category}</span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[13px] font-medium leading-relaxed text-zinc-500">{prod.desc}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <button onClick={() => openProductModal(prod)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-zinc-900 px-4 py-2.5 text-[13px] font-black text-white transition hover:bg-black active:scale-[0.98]"><ShoppingCart className="h-4 w-4" />Adicionar</button>
                    <span className="grid h-[42px] w-[42px] place-items-center rounded-full border border-zinc-200 bg-white text-zinc-700"><Heart className="h-4 w-4" /></span>
                  </div>
                  {prod.badge === "Confirmado" && <div className="mt-2 text-center text-[10px] font-bold tracking-[0.08em] text-emerald-600">✓ ITEM CONFIRMADO</div>}
                </div>
              </motion.div>
            ))}
          </div>

          <AnimatePresence>
            {cartCount > 0 && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="sticky bottom-4 z-20 mt-8 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-zinc-200 bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)] sm:p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e30613] text-white"><ShoppingBag className="h-5 w-5" /></span>
                  <div>
                    <div className="text-sm font-black text-zinc-900">{cartCount} {cartCount === 1 ? "item" : "itens"} • {formatBRL(cartTotal)}</div>
                    <div className="text-xs font-medium text-zinc-500">Pronto para finalizar no WhatsApp</div>
                  </div>
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                  <button onClick={() => setIsCartOpen(true)} className="flex-1 rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-bold text-zinc-900 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 sm:flex-none">Ver carrinho</button>
                  <button onClick={handleWhatsAppCheckout} className="flex-1 rounded-full bg-[#25d366] px-5 py-2.5 text-sm font-black text-white hover:brightness-110 sm:flex-none">Finalizar no WhatsApp</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-center text-xs font-medium text-zinc-500">
            <span>Prefere pedir pelo app?</span>
            <a href={SETTINGS.ifoodUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#ea1d2c] px-4 py-2 text-sm font-black text-white hover:bg-[#c41422]"><span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[10px] font-black text-[#ea1d2c]">iF</span>Pedir pelo iFood<ArrowUpRight className="h-3.5 w-3.5" /></a>
          </div>
        </div>
      </section>

      {/* VENHA NOS VISITAR — sem galeria, só localização */}
      <section id="localizacao" className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(227,6,19,0.06),_transparent_60%)]" />
        <div className="relative mx-auto max-w-[1280px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-stretch">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }} className="relative overflow-hidden rounded-[24px] border border-zinc-200 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:p-8">
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,_rgba(227,6,19,0.08),_transparent_70%)]" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-black tracking-[0.14em] text-zinc-700"><MapPin className="h-3.5 w-3.5 text-[#e30613]" />VENHA NOS VISITAR</div>
                <h2 className="mt-4 font-display text-[34px] font-black leading-[0.92] tracking-[-0.03em] text-zinc-900 sm:text-[40px]">ESTAMOS NO<br /><span className="text-[#e30613]">CENTRO</span> DE TUBARÃO</h2>
                <div className="mt-6 flex items-start gap-3 rounded-2xl bg-zinc-900 p-4 text-white">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-zinc-900"><MapPin className="h-5 w-5" /></span>
                  <div>
                    <div className="text-[13px] font-black tracking-wide">AV. PEDRO ZAPELINI, 1450</div>
                    <div className="text-[13px] font-medium text-zinc-300">Centro, Tubarão – SC • 88701-730</div>
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#ffc300]"><Navigation className="h-3.5 w-3.5" />Fácil acesso • Estacionamento próximo</div>
                  </div>
                </div>
                <div className={`mt-4 flex items-center justify-between rounded-2xl border p-4 ${isOpen ? "border-emerald-200 bg-emerald-50" : "border-zinc-200 bg-zinc-50"}`}>
                  <div className="flex items-center gap-3">
                    <span className={`relative grid h-10 w-10 place-items-center rounded-full ${isOpen ? "bg-emerald-500 text-white" : "bg-zinc-700 text-white"}`}><Clock className="h-5 w-5" />{isOpen && <><span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-ping rounded-full bg-emerald-400" /><span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-emerald-400" /></>}</span>
                    <div><div className={`text-sm font-black ${isOpen ? "text-emerald-700" : "text-zinc-700"}`}>{label}</div><div className="text-xs font-medium text-zinc-500">{isOpen ? detail : "Abre às 18h • todos os dias"}</div></div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black tracking-wide ${isOpen ? "bg-emerald-500 text-white" : "bg-zinc-200 text-zinc-600"}`}>{isOpen ? "● ABERTO" : "○ FECHADO"}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-zinc-500"><Clock className="h-3.5 w-3.5" />Todos os dias das {String(SETTINGS.openHour).padStart(2,"0")}h às {SETTINGS.closeHour===0?"00":String(SETTINGS.closeHour).padStart(2,"0")}h — verificado</div>
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <a href={GMAPS_LINK_DYN} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#e30613] px-6 py-3 text-sm font-black text-white shadow-[0_10px_30px_rgba(227,6,19,0.25)] hover:bg-[#b8050f] active:scale-[0.98]"><Navigation className="h-4 w-4" />Como chegar</a>
                  <a href={getWhatsAppHref()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-zinc-900 ring-1 ring-zinc-300 hover:bg-zinc-900 hover:text-white hover:ring-zinc-900 active:scale-[0.98]"><MessageCircle className="h-4 w-4" />Chamar no WhatsApp</a>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.12 }} className="relative overflow-hidden rounded-[24px] border border-zinc-200 bg-white p-2 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
              <div className="relative h-[380px] overflow-hidden rounded-[18px] bg-zinc-100 sm:h-[460px] lg:h-full lg:min-h-[480px]">
                <iframe title="Mapa Boka Loka Lanches" src={GMAPS_EMBED_DYN} width="100%" height="100%" style={{ border: 0, filter: "contrast(1.05)" }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
                <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-[#e30613]/20" />
                  <span className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-[#e30613]/30 [animation-delay:0.6s]" />
                  <span className="relative grid h-12 w-12 place-items-center rounded-full bg-[#e30613] text-white shadow-[0_10px_30px_rgba(227,6,19,0.35)]"><MapPin className="h-6 w-6 fill-white" /></span>
                </div>
                <div className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-zinc-200 sm:left-4 sm:right-auto sm:w-[300px]">
                  <div className="flex items-center gap-3">
                    <img src="/burger-icon.svg" alt="" className="h-12 w-12 rounded-xl object-cover ring-1 ring-zinc-200 bg-white p-1" />
                    <div>
                      <div className="text-sm font-black leading-none text-zinc-900">Boka Loka Lanches</div>
                      <div className="mt-0.5 flex items-center gap-1 text-xs font-bold text-zinc-500"><Star className="h-3 w-3 fill-[#ffc300] text-[#ffc300]" />4.6 • Centro, Tubarão</div>
                    </div>
                    <span className={`ml-auto rounded-full px-2.5 py-1 text-[11px] font-black ${isOpen ? "bg-emerald-500 text-white" : "bg-zinc-200 text-zinc-600"}`}>{isOpen ? "Aberto" : "Fechado"}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FOOTER — adulto, branco/vermelho/amarelo */}
      <footer className="relative overflow-hidden border-t border-zinc-200 bg-zinc-900 text-zinc-300">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(227,6,19,0.12),_transparent_60%)]" />
        <div className="relative mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr_0.9fr]">
            <div>
              <div className="flex items-center gap-3">
                <img src={SETTINGS.logo} alt="Boka Loka Lanches" className="h-[52px] w-auto rounded-xl object-contain ring-1 ring-white/20 shadow-[0_4px_14px_rgba(0,0,0,0.2)]" onError={(e)=>{e.currentTarget.style.display='none';}} />
                <div className="hidden sm:block">
                  <div className="text-xs font-bold tracking-[0.14em] text-zinc-400">TUBARÃO • SANTA CATARINA</div>
                  <div className="text-[11px] font-medium tracking-wide text-zinc-500">Desde 1986 • Tradição que te deixa loko</div>
                </div>
              </div>
              <p className="mt-4 max-w-[420px] text-sm leading-relaxed text-zinc-400">Nossos lanches são uma amostra de sabores e criatividade. Qualidade, sabor e atendimento que fazem você voltar sempre.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={`tel:${SETTINGS.phoneTel}`} className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-black text-zinc-900 transition hover:bg-[#ffc300] active:scale-[0.98]"><Phone className="h-4 w-4" />{SETTINGS.phoneDisplay}<span className="hidden text-xs font-bold opacity-60 sm:inline">• Ligar</span></a>
                <a href={SETTINGS.instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white hover:text-zinc-900"><Instagram className="h-4 w-4" />@bokalokalanchestb</a>
              </div>
              <button onClick={handleSaveContact} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#ffc300] px-5 py-3 text-sm font-black tracking-wide text-zinc-900 transition hover:bg-[#ffb700] active:scale-[0.98] sm:w-auto">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-zinc-900 text-white"><Plus className="h-3.5 w-3.5" /></span>Salvar contato (.vcf) — 1 clique
              </button>
              <div className="mt-2 text-xs font-medium text-zinc-500">Gera e baixa um arquivo <span className="font-bold text-white">.vcf</span> com nome, telefone e endereço — sem servidor.</div>
            </div>

            <div>
              <div className="text-xs font-black tracking-[0.14em] text-white">ATENDIMENTO</div>
              <ul className="mt-4 space-y-2.5 text-sm font-medium text-zinc-400">
                <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-zinc-500" />Todos os dias das {String(SETTINGS.openHour).padStart(2,"0")}h às {SETTINGS.closeHour===0?"00":String(SETTINGS.closeHour).padStart(2,"0")}h</li>
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-zinc-500" />{SETTINGS.address}</li>
                <li><a href={SETTINGS.ifoodUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-white hover:text-[#ffc300]">Pedir pelo iFood<ArrowUpRight className="h-3.5 w-3.5" /></a></li>
                <li><a href={GMAPS_LINK_DYN} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-zinc-300 hover:text-white">Como chegar no Google Maps<Navigation className="h-3.5 w-3.5" /></a></li>
              </ul>
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-xs font-black tracking-[0.12em] text-white"><span className={`h-2 w-2 animate-pulse rounded-full ${isOpen ? "bg-emerald-400" : "bg-zinc-500"}`} />STATUS AGORA: {label.toUpperCase()}</div>
                <div className="mt-1 text-xs font-medium text-zinc-400">{isOpen ? `Aberto • fecha às 00h` : `Fechado • abre às 18h`}</div>
              </div>
            </div>

            <div>
              <div className="text-xs font-black tracking-[0.14em] text-white">FIQUE POR DENTRO</div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">Promoções e novidades direto no seu WhatsApp. Sem spam, só sabor.</p>
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex gap-2">
                  <input placeholder="Seu WhatsApp" className="w-full rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-white placeholder:text-zinc-500 focus:border-[#ffc300]/40 focus:outline-none focus:ring-2 focus:ring-[#ffc300]/20" />
                  <button onClick={() => { setToast("Em breve! Por enquanto, chame no WhatsApp 😊"); setTimeout(() => setToast(null), 2400); }} className="shrink-0 rounded-full bg-[#e30613] px-5 py-2.5 text-sm font-black text-white hover:bg-[#b8050f] active:scale-95">Enviar</button>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <a href={getWhatsAppHref()} target="_blank" rel="noopener noreferrer" className="group grid h-9 w-9 place-items-center rounded-full bg-[#25d366] text-white transition hover:scale-110 hover:rotate-3" aria-label="WhatsApp"><MessageCircle className="h-4 w-4 fill-white" /></a>
                  <a href={SETTINGS.instagramUrl} target="_blank" rel="noopener noreferrer" className="group grid h-9 w-9 place-items-center rounded-full bg-white text-zinc-900 transition hover:scale-110 hover:rotate-3" aria-label="Instagram"><Instagram className="h-4 w-4" /></a>
                  <a href={SETTINGS.ifoodUrl} target="_blank" rel="noopener noreferrer" className="grid h-9 w-9 place-items-center rounded-full bg-[#ea1d2c] text-[11px] font-black text-white transition hover:scale-110" aria-label="iFood">iF</a>
                  <span className="ml-1 text-xs font-semibold text-zinc-500">Siga • Peça • Avalie</span>
                </div>
              </div>
              <div className="mt-6 rounded-2xl bg-[#e30613] p-4 text-white">
                <div className="flex items-center gap-2 text-xs font-black tracking-[0.12em] text-white/90"><Zap className="h-4 w-4 fill-white" />ENTREGA RÁPIDA</div>
                <div className="mt-1 font-display text-[20px] font-black leading-none">30–40 MIN</div>
                <div className="text-xs font-bold opacity-90">no Centro e bairros próximos</div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs font-medium text-zinc-500 sm:flex-row">
            <div>© {new Date().getFullYear()} Boka Loka Lanches • Tubarão/SC • Todos os direitos reservados • <a href="/admin" className="font-bold text-zinc-400 hover:text-white">Admin</a></div>
            <div className="flex items-center gap-3"><span className="hidden sm:inline">Feito com</span><Heart className="h-3.5 w-3.5 fill-[#e30613] text-[#e30613]" /><span>para quem ama hambúrguer de verdade</span></div>
          </div>
        </div>
      </footer>
      <div className="h-[72px] lg:hidden" aria-hidden="true" />

      {/* PRODUCT MODAL — quantidade + acompanhamentos + ingredientes + observação */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeProductModal} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.96 }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="flex max-h-[92vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)] ring-1 ring-zinc-200">
                <div className="relative h-[220px] shrink-0 overflow-hidden bg-zinc-100 sm:h-[260px]">
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-transparent" />
                  <button onClick={closeProductModal} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-zinc-900 backdrop-blur hover:bg-white">
                    <X className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
                    <div>
                      <div className="inline-flex rounded-full bg-[#e30613] px-3 py-1 text-[11px] font-black text-white">{selectedProduct.badge?.toUpperCase()}</div>
                      <div className="mt-1 font-display text-[22px] font-black leading-none text-white drop-shadow">{selectedProduct.name}</div>
                      <div className="text-xs font-medium text-white/90">{selectedProduct.category}</div>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1.5 font-display text-[16px] font-black text-zinc-900 shadow">{formatBRL(getDisplayPrice(selectedProduct))}</div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                  <p className="text-[13.5px] font-medium leading-relaxed text-zinc-600">{selectedProduct.desc}</p>

                  {/* Ingredientes — pode remover */}
                  <div className="mt-5">
                    <div className="flex items-center gap-2 text-[11px] font-black tracking-[0.12em] text-zinc-700">
                      <Utensils className="h-3.5 w-3.5 text-[#e30613]" />
                      INGREDIENTES — desmarque o que não quer
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {(PRODUCT_INGREDIENTS[selectedProduct.id] || []).map((ing) => (
                        <label key={ing} className={`flex items-center gap-2 rounded-full border px-3 py-2 text-[13px] font-medium transition cursor-pointer ${removedIngredients.includes(ing) ? "border-zinc-200 bg-zinc-50 text-zinc-400 line-through" : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"}`}>
                          <input type="checkbox" checked={!removedIngredients.includes(ing)} onChange={() => toggleIngredient(ing)} className="h-4 w-4 rounded border-zinc-300 text-[#e30613] focus:ring-[#e30613]" />
                          <span className="capitalize">{ing}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Acompanhamentos / Extras */}
                  <div className="mt-6">
                    <div className="text-[11px] font-black tracking-[0.12em] text-zinc-700">ACOMPANHAMENTOS — adicione</div>
                    <div className="mt-3 grid gap-2">
                      {EXTRAS_CATALOG.map((ex) => (
                        <label key={ex.id} className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition cursor-pointer ${selectedExtras.includes(ex.id) ? "border-[#e30613] bg-[#fff1f1]" : "border-zinc-200 bg-white hover:bg-zinc-50"}`}>
                          <span className="flex items-center gap-3">
                            <input type="checkbox" checked={selectedExtras.includes(ex.id)} onChange={() => toggleExtra(ex.id)} className="h-4 w-4 rounded border-zinc-300 text-[#e30613] focus:ring-[#e30613]" />
                            <span className="text-[13px] font-bold text-zinc-800">{ex.name}</span>
                          </span>
                          <span className="text-[13px] font-black text-[#e30613]">+{formatBRL(ex.price)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Observação */}
                  <div className="mt-6">
                    <div className="text-[11px] font-black tracking-[0.12em] text-zinc-700">OBSERVAÇÃO</div>
                    <textarea value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="Ex: sem cebola, ponto da carne, etc." rows={2} className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 placeholder:text-zinc-400 focus:border-[#e30613]/40 focus:outline-none focus:ring-2 focus:ring-[#e30613]/15" />
                  </div>

                  {/* Quantidade */}
                  <div className="mt-6 flex items-center justify-between rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
                    <div className="text-sm font-black text-zinc-900">Quantidade</div>
                    <div className="flex items-center gap-2 rounded-full bg-white p-1 ring-1 ring-zinc-200">
                      <button onClick={() => setModalQty((q) => Math.max(1, q - 1))} className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200"><Minus className="h-4 w-4" /></button>
                      <span className="min-w-8 text-center text-sm font-black text-zinc-900">{modalQty}</span>
                      <button onClick={() => setModalQty((q) => q + 1)} className="grid h-8 w-8 place-items-center rounded-full bg-zinc-900 text-white hover:bg-black"><Plus className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-200 bg-white p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-zinc-500">Total</div>
                    <div className="font-display text-[20px] font-black text-zinc-900">
                      {formatBRL((getDisplayPrice(selectedProduct) + selectedExtras.reduce((s, id) => s + (EXTRAS_CATALOG.find((e) => e.id === id)?.price || 0), 0)) * modalQty)}
                    </div>
                  </div>
                  <button onClick={confirmAddToCart} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#e30613] py-3.5 text-sm font-black text-white hover:bg-[#b8050f] active:scale-[0.98]">
                    <ShoppingCart className="h-4 w-4" />
                    Adicionar ao carrinho • {formatBRL((getDisplayPrice(selectedProduct) + selectedExtras.reduce((s, id) => s + (EXTRAS_CATALOG.find((e) => e.id === id)?.price || 0), 0)) * modalQty)}
                  </button>
                  <button onClick={closeProductModal} className="mt-2 w-full rounded-full py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900">Continuar comprando</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CART DRAWER */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.2)]">
              <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-zinc-900 text-white"><ShoppingBag className="h-5 w-5" /></span>
                  <div><div className="text-sm font-black leading-none text-zinc-900">Seu carrinho</div><div className="text-xs font-medium text-zinc-500">{cartCount === 0 ? "vazio por enquanto" : `${cartCount} ${cartCount === 1 ? "item" : "itens"} • ${formatBRL(cartTotal)}`}</div></div>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-900 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
                {cart.length === 0 ? (
                  <div className="grid place-items-center gap-4 py-16 text-center">
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-zinc-100 text-zinc-400"><ShoppingCart className="h-7 w-7" /></span>
                    <div><div className="font-display text-[18px] font-black text-zinc-900">CARRINHO VAZIO</div><div className="mt-1 max-w-[260px] text-sm font-medium leading-relaxed text-zinc-500">Adicione seus lanches favoritos e finalize direto no WhatsApp em segundos.</div></div>
                    <button onClick={() => setIsCartOpen(false)} className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-black text-white hover:bg-black">Ver cardápio</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item, idx) => {
                      const prod = EFFECTIVE_PRODUCTS.find((p) => p.id === item.id);
                      if (!prod) return null;
                      const extrasPrice = item.extrasPrice || 0;
                      const unitPrice = getDisplayPrice(prod) + extrasPrice;
                      return (
                        <div key={`${item.id}-${idx}`} className="flex gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                          <img src={prod.image} alt={prod.name} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                          <div className="min-w-0 flex-1">
                            <div className="pr-6 font-display text-[14px] font-black leading-none text-zinc-900">{prod.name}</div>
                            <div className="mt-1 text-xs font-medium text-zinc-500 line-clamp-1">{prod.desc}</div>
                            {item.extras?.length > 0 && <div className="mt-1 text-xs font-bold text-[#e30613]">+ {item.extras.map((id) => EXTRAS_CATALOG.find((e) => e.id === id)?.name).join(", ")}</div>}
                            {item.removed?.length > 0 && <div className="mt-1 text-xs font-medium text-zinc-400">sem: {item.removed.join(", ")}</div>}
                            {item.observation && <div className="mt-1 text-xs italic text-zinc-500">obs: {item.observation}</div>}
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1 rounded-full border border-zinc-200 bg-white p-1">
                                <button onClick={() => updateQtyByIndex(idx, item.qty - 1)} className="grid h-7 w-7 place-items-center rounded-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 active:scale-95"><Minus className="h-3.5 w-3.5" /></button>
                                <span className="min-w-7 text-center text-sm font-black text-zinc-900">{item.qty}</span>
                                <button onClick={() => updateQtyByIndex(idx, item.qty + 1)} className="grid h-7 w-7 place-items-center rounded-full bg-zinc-900 text-white hover:bg-black active:scale-95"><Plus className="h-3.5 w-3.5" /></button>
                              </div>
                              <div className="text-right"><div className="text-sm font-black text-zinc-900">{formatBRL(unitPrice * item.qty)}</div><div className="text-xs font-medium text-zinc-500">{formatBRL(unitPrice)} un.</div></div>
                            </div>
                          </div>
                          <button onClick={() => removeByIndex(idx)} className="grid h-8 w-8 place-items-center rounded-full bg-white text-zinc-400 ring-1 ring-zinc-200 hover:bg-[#e30613] hover:text-white hover:ring-[#e30613]"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {cart.length > 0 && (
                <div className="border-t border-zinc-200 bg-white p-4 sm:p-5">
                  <div className="space-y-2 rounded-2xl bg-zinc-900 p-4 text-white">
                    <div className="flex justify-between text-sm font-medium text-zinc-400"><span>Subtotal</span><span className="font-bold text-white">{formatBRL(cartTotal)}</span></div>
                    <div className="flex justify-between text-sm font-medium text-zinc-400"><span>Entrega</span><span className="font-bold text-emerald-400">a combinar</span></div>
                    <div className="flex justify-between border-t border-white/10 pt-2 text-base font-black"><span>Total</span><span className="font-display text-[18px]">{formatBRL(cartTotal)}</span></div>
                    <div className="text-xs font-medium text-zinc-400">Taxa de entrega informada no WhatsApp</div>
                  </div>

                  <div className="mt-4">
                    <div className="text-[11px] font-black tracking-[0.12em] text-zinc-700">FORMA DE PAGAMENTO</div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {[
                        { id: "pix", label: "Pix", icon: QrCode },
                        { id: "card", label: "Cartão", icon: CreditCard },
                        { id: "money", label: "Dinheiro", icon: Banknote },
                      ].map((m) => (
                        <button key={m.id} onClick={() => setPaymentMethod(m.id)} className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-xs font-black ring-1 transition ${paymentMethod === m.id ? "bg-zinc-900 text-white ring-zinc-900" : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50"}`}>
                          <m.icon className="h-3.5 w-3.5" />{m.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 text-center text-[11px] font-medium text-zinc-500">Selecionado: <span className="font-black text-zinc-900">{paymentMethod === "pix" ? "Pix — verificação antes de confirmar" : paymentMethod === "card" ? "Cartão na entrega" : "Dinheiro — troco na entrega"}</span></div>
                  </div>

                  <button onClick={handleOpenSiteCheckout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#e30613] py-3.5 text-sm font-black text-white shadow-[0_10px_30px_rgba(227,6,19,0.3)] hover:bg-[#b8050f] active:scale-[0.98]"><ShoppingBag className="h-5 w-5" />Pagar no site — {formatBRL(cartTotal)}</button>
                  <div className="mt-1 text-center text-[11px] font-bold text-zinc-500">PIX verificado antes de confirmar • sem WhatsApp</div>
                  <button onClick={handleWhatsAppCheckout} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-black text-zinc-700 ring-1 ring-zinc-300 hover:bg-zinc-50 active:scale-[0.98]"><MessageCircle className="h-4 w-4" />Ou finalizar via WhatsApp</button>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <a href={`tel:${SETTINGS.phoneTel}`} className="flex items-center justify-center gap-1.5 rounded-full bg-white py-3 text-sm font-black text-zinc-900 ring-1 ring-zinc-300 hover:bg-zinc-900 hover:text-white hover:ring-zinc-900"><Phone className="h-4 w-4" />Ligar agora</a>
                    <a href={SETTINGS.ifoodUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 rounded-full border border-zinc-300 bg-white py-3 text-sm font-bold text-zinc-700 hover:bg-zinc-900 hover:text-white hover:border-zinc-900"><span className="grid h-5 w-5 place-items-center rounded-full bg-[#ea1d2c] text-[10px] font-black text-white">iF</span>iFood</a>
                  </div>
                  <div className="mt-2 text-center text-xs font-medium text-zinc-500">Pedido salvo no sistema • admin vê forma de pagamento</div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CHECKOUT DIRETO NO SITE — com verificação PIX */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCheckoutOpen(false)} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.97 }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div className="flex max-h-[92vh] w-full max-w-[480px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.3)] ring-1 ring-zinc-200">
                {/* header */}
                <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e30613] text-white"><Package className="h-5 w-5" /></span>
                    <div>
                      <div className="text-sm font-black leading-none text-zinc-900">Finalizar pedido</div>
                      <div className="text-xs font-medium text-zinc-500">{checkoutStep === "form" ? "Seus dados" : checkoutStep === "pix" ? `PIX • ${formatBRL(cartTotal)}` : "Pedido confirmado!"}</div>
                    </div>
                  </div>
                  <button onClick={() => setIsCheckoutOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-900 hover:text-white"><X className="h-5 w-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  {checkoutStep === "form" && (
                    <div className="space-y-4">
                      <div className="rounded-2xl bg-amber-50 p-3 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                        {paymentMethod === "pix" ? "🔒 PIX: pagamento verificado antes de confirmar. Não confirmamos sem o PIX cair." : paymentMethod === "card" ? "💳 Cartão será pago na entrega." : "💵 Dinheiro — troco na entrega."}
                      </div>
                      <div className="rounded-2xl bg-zinc-50 p-3 text-xs font-medium text-zinc-600">
                        {cart.length} itens • {formatBRL(cartTotal)} • {paymentMethod === "pix" ? "PIX" : paymentMethod === "card" ? "Cartão" : "Dinheiro"}
                      </div>
                      <label className="space-y-1 block">
                        <span className="text-xs font-black tracking-wide text-zinc-700 flex items-center gap-1.5"><User className="h-3.5 w-3.5"/>Nome completo *</span>
                        <input value={customer.name} onChange={e=>setCustomer({...customer, name: e.target.value})} placeholder="Seu nome" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
                      </label>
                      <label className="space-y-1 block">
                        <span className="text-xs font-black tracking-wide text-zinc-700 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5"/>WhatsApp / Telefone *</span>
                        <input value={customer.phone} onChange={e=>setCustomer({...customer, phone: e.target.value})} placeholder="(48) 99999-9999" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
                      </label>
                      <label className="space-y-1 block">
                        <span className="text-xs font-black tracking-wide text-zinc-700 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5"/>Endereço completo *</span>
                        <textarea value={customer.address} onChange={e=>setCustomer({...customer, address: e.target.value})} rows={2} placeholder="Rua, número, bairro, complemento" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
                      </label>
                      <label className="space-y-1 block">
                        <span className="text-xs font-black tracking-wide text-zinc-700">CPF (opcional p/ PIX)</span>
                        <input value={customer.cpf} onChange={e=>setCustomer({...customer, cpf: e.target.value.replace(/\D/g,"").slice(0,11)})} placeholder="00000000000" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
                        <span className="text-[11px] text-zinc-500">Usado para gerar PIX no Mercado Pago (se configurado).</span>
                      </label>
                      {orderError && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700 ring-1 ring-red-200">{orderError}</div>}
                      <div className="flex gap-2 pt-2">
                        <button onClick={()=>setIsCheckoutOpen(false)} className="flex-1 rounded-full bg-white py-3 text-sm font-black ring-1 ring-zinc-200">Voltar</button>
                        <button onClick={handleCreateOrder} disabled={verifyingPix} className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 py-3 text-sm font-black text-white hover:bg-black disabled:opacity-60">
                          {verifyingPix ? <Loader2 className="h-4 w-4 animate-spin"/> : paymentMethod==="pix" ? <QrCode className="h-4 w-4"/> : <Check className="h-4 w-4"/>}
                          {paymentMethod==="pix" ? "Gerar PIX" : "Confirmar pedido"}
                        </button>
                      </div>
                      <div className="text-center text-xs text-zinc-500">Ao confirmar você aceita os termos da loja. {paymentMethod==="pix" && "PIX será verificado antes de liberar o preparo."}</div>
                    </div>
                  )}

                  {checkoutStep === "pix" && currentOrder && (
                    <div className="space-y-4 text-center">
                      <div className="rounded-2xl bg-zinc-900 p-4 text-white">
                        <div className="text-xs font-black tracking-[0.12em] text-white/70">PEDIDO #{currentOrder.id.slice(0,6).toUpperCase()} • PIX • {formatBRL(currentOrder.total)}</div>
                        <div className="mt-1 text-sm font-bold">Status: <span className={currentOrder.status==="paid"||currentOrder.status==="confirmed" ? "text-emerald-400" : "text-amber-300"}>{currentOrder.status==="pending_pix" ? "Aguardando pagamento" : currentOrder.status}</span></div>
                      </div>
                      <div className="grid place-items-center rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
                        <img src={currentOrder.pixQr} alt="QR PIX" className="h-56 w-56 rounded-xl object-contain ring-1 ring-zinc-200" onError={(e)=>{e.currentTarget.style.display='none'}} />
                        <div className="mt-3 w-full rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-200">
                          <div className="text-[11px] font-black tracking-wide text-zinc-500">PIX COPIA E COLA</div>
                          <div className="mt-1 break-all text-xs font-mono text-zinc-800">{currentOrder.pixCode}</div>
                          <button onClick={()=>{ navigator.clipboard.writeText(currentOrder.pixCode); setToast("PIX copiado!"); setTimeout(()=>setToast(null),2000); }} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-black ring-1 ring-zinc-200 hover:bg-zinc-900 hover:text-white"><Copy className="h-3.5 w-3.5"/>Copiar código</button>
                        </div>
                      </div>
                      <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                        1) Pague no app do banco • 2) Volte e clique em “Já paguei, verificar” • Pedido só é confirmado após verificação.
                      </div>
                      {orderError && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700 ring-1 ring-red-200">{orderError}</div>}
                      {currentOrder.status==="paid" || currentOrder.status==="confirmed" ? (
                        <div className="rounded-xl bg-emerald-50 px-3 py-3 text-sm font-black text-emerald-700 ring-1 ring-emerald-200">✅ PIX confirmado! Seu pedido já está em preparo.</div>
                      ) : (
                        <button onClick={()=>handleVerifyPix(false)} disabled={verifyingPix} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25d366] py-3.5 text-sm font-black text-white hover:brightness-110 disabled:opacity-60">
                          {verifyingPix ? <Loader2 className="h-4 w-4 animate-spin"/> : <QrCode className="h-4 w-4"/>}
                          {verifyingPix ? "Verificando..." : "Já paguei, verificar PIX"}
                        </button>
                      )}
                      <div className="text-xs text-zinc-500">Verificação automática a cada 7s • Em modo mock, admin pode confirmar no painel.</div>
                      <button onClick={()=>setCheckoutStep("form")} className="w-full rounded-full py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900">Editar dados</button>
                    </div>
                  )}

                  {checkoutStep === "success" && currentOrder && (
                    <div className="space-y-4 text-center">
                      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-8 w-8"/></div>
                      <div className="font-display text-[22px] font-black leading-none">PEDIDO CONFIRMADO!</div>
                      <div className="rounded-2xl bg-zinc-900 p-4 text-white text-left">
                        <div className="text-xs font-black tracking-wide text-white/60">PEDIDO #{currentOrder.id.slice(0,6).toUpperCase()}</div>
                        <div className="mt-2 space-y-1 text-sm">
                          <div><span className="font-bold text-zinc-400">Cliente:</span> {currentOrder.customerName} • {currentOrder.customerPhone}</div>
                          <div><span className="font-bold text-zinc-400">Endereço:</span> {currentOrder.customerAddress}</div>
                          <div><span className="font-bold text-zinc-400">Pagamento:</span> {currentOrder.paymentMethod==="pix" ? "PIX (verificado)" : currentOrder.paymentMethod==="card" ? "Cartão" : "Dinheiro"} • <span className="font-black text-emerald-400">{currentOrder.status.toUpperCase()}</span></div>
                          <div><span className="font-bold text-zinc-400">Total:</span> {formatBRL(currentOrder.total)}</div>
                        </div>
                      </div>
                      <div className="text-sm text-zinc-600">Acompanhe seu pedido. Entraremos em contato via WhatsApp.</div>
                      <button onClick={()=>{ setIsCheckoutOpen(false); setCurrentOrder(null); }} className="w-full rounded-full bg-zinc-900 py-3 text-sm font-black text-white">Fechar</button>
                      <a href={`https://wa.me/${(SETTINGS.whatsappNumber||WHATSAPP_NUMBER).replace(/\D/g,"")}?text=${encodeURIComponent(`Olá! Meu pedido #${currentOrder.id.slice(0,6).toUpperCase()} foi pago via ${currentOrder.paymentMethod.toUpperCase()} no site. Pode confirmar?`)}`} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25d366] py-3 text-sm font-black text-white"><MessageCircle className="h-4 w-4 fill-white"/>Falar no WhatsApp</a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MOBILE STICKY BAR — Ligar + WhatsApp + Carrinho (melhor conversão mobile) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-white/80 lg:hidden" style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}>
        <div className="mx-auto flex max-w-[480px] items-center gap-2">
          <a href={`tel:${SETTINGS.phoneTel}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white py-3 text-[13px] font-black text-zinc-900 ring-1 ring-zinc-300 active:scale-[0.97]">
            <Phone className="h-4 w-4" />
            Ligar
          </a>
          <a href={getWhatsAppHref()} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#25d366] py-3 text-[13px] font-black text-white active:scale-[0.97]">
            <MessageCircle className="h-4 w-4 fill-white" />
            WhatsApp
          </a>
          <button onClick={() => setIsCartOpen(true)} className="relative flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#e30613] py-3 text-[13px] font-black text-white active:scale-[0.97]">
            <ShoppingBag className="h-4 w-4" />
            Carrinho
            {cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-zinc-900 px-1 text-[11px] font-black text-white">{cartCount}</span>}
          </button>
        </div>
      </div>

      {/* FLOATING WHATSAPP — desktop only (mobile usa barra) */}
      <motion.a href={getWhatsAppHref()} target="_blank" rel="noopener noreferrer" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2, type: "spring", stiffness: 300, damping: 18 }} className="fixed bottom-5 right-5 z-30 hidden h-[58px] w-[58px] place-items-center rounded-full bg-[#25d366] text-white shadow-[0_12px_36px_rgba(37,211,102,0.45)] hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6 sm:h-[60px] sm:w-[60px] lg:grid" aria-label="Chamar no WhatsApp">
        <span className="absolute inset-0 animate-ping rounded-full bg-[#25d366]/40" />
        <span className="absolute inset-0 animate-ping rounded-full bg-[#25d366]/20 [animation-delay:0.7s]" />
        <MessageCircle className="relative h-7 w-7 fill-white" />
        {cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-white px-1 text-xs font-black text-[#25d366] shadow-lg ring-1 ring-zinc-200">{cartCount}</span>}
      </motion.a>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: 40, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.96 }} className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold text-white shadow-[0_16px_40px_rgba(0,0,0,0.25)] sm:bottom-6">
            <span className="inline-flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white"><Check className="h-3.5 w-3.5" /></span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Restaurant", name: "Boka Loka Lanches", description: "Nossos lanches são uma amostra de sabores e criatividade.", address: { "@type": "PostalAddress", streetAddress: SETTINGS.address, addressLocality: "Tubarão", addressRegion: "SC", postalCode: "88701-730", addressCountry: "BR" }, telephone: SETTINGS.whatsappNumber, url: SETTINGS.instagramUrl, servesCuisine: "Hambúrguer", priceRange: "R$", aggregateRating: { "@type": "AggregateRating", ratingValue: "4.6", reviewCount: "1600" }, openingHours: "Mo-Su 18:00-00:00" }) }} />
    </div>
  );
}
