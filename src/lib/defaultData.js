// Dados padrão — usados para seed do localStorage na primeira visita
export const DEFAULT_SETTINGS = {
  address: "Av. Pedro Zapelini, 1450 – Centro, Tubarão – SC, 88701-730",
  gmapsLink: "https://www.google.com/maps/search/?api=1&query=Av.%20Pedro%20Zapelini%2C%201450%20%E2%80%93%20Centro%2C%20Tubar%C3%A3o%20%E2%80%93%20SC%2C%2088701-730",
  phoneDisplay: "(48) 3622-3376",
  phoneTel: "+554836223376",
  whatsappNumber: "5548988452532",
  instagramUrl: "https://instagram.com/bokalokalanchestb",
  ifoodUrl: "https://www.ifood.com.br/delivery/tubarao-sc/boka-loka-lanches-santo-antonio-de-padua/d17f480a-0eae-4876-8071-c635950e85ef",
  logo: "/logo-nova.avif",
  heroTitle: "BOKA LOKA",
  heroSubtitle: "Simples, bom e ponto. O lanche tradicional de Tubarão.",
  openHour: 18,
  closeHour: 0,
};

export const DEFAULT_ADMINS = [
  { id: "1", email: "admin@bokaloka.com", password: "boka123", name: "Admin Master", role: "super", createdAt: new Date().toISOString() },
];

export const DEFAULT_ACCOUNTS = [
  { id: "acc1", name: "Cliente Demo", email: "cliente@email.com", phone: "(48) 99999-9999", password: "123456", createdAt: new Date().toISOString() },
];

export const DEFAULT_DISCOUNTS = [
  // { id, label, percent, category, productId, active }
];

export const DEFAULT_PRODUCTS = [
  { id: "x-mignon", name: "X-Mignon", desc: "Filé mignon 180g, queijo muçarela, bacon crocante, alface, tomate e molho da casa.", price: 35.5, category: "Especiais", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80&auto=format&fit=crop&crop=center", badge: "EM DESTAQUE", popular: true },
  { id: "x-salada", name: "X-Salada", desc: "Pão brioche selado, carne 180g, queijo muçarela, alface americana, tomate, milho, ervilha e batata palha extra crocante.", price: 28.9, category: "Clássicos", image: "https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Confirmado", popular: true },
  { id: "x-burguer", name: "X-Burguer", desc: "Pão brioche, carne 180g, queijo cheddar derretido e maionese da casa.", price: 24.9, category: "Clássicos", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Clássico" },
  { id: "x-egg", name: "X-Egg", desc: "Carne 180g, queijo, ovo frito na chapa, alface e tomate.", price: 30.9, category: "Clássicos", image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Clássico" },
  { id: "x-bacon", name: "X-Bacon Supremo", desc: "Carne 180g, cheddar cremoso, bacon defumado ultra crocante, alface, tomate e maionese da casa.", price: 34.9, category: "Clássicos", image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Mais pedido", popular: true },
  { id: "x-calabresa", name: "X-Calabresa", desc: "Carne 180g, calabresa fatiada, queijo muçarela, vinagrete e maionese verde.", price: 32.9, category: "Clássicos", image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Clássico" },
  { id: "bauru", name: "Bauru da Casa", desc: "Presunto, muçarela derretida, tomate, alface, orégano e pão francês prensado.", price: 26.9, category: "Clássicos", image: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Clássico" },
  { id: "x-coracao", name: "X-Coração", desc: "Coração de frango 150g, queijo, alface, tomate, milho e maionese da casa.", price: 33.9, category: "Clássicos", image: "https://images.unsplash.com/photo-1606756790138-261d2b21cd75?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Clássico" },
  { id: "x-picanha", name: "X-Picanha 200g", desc: "Picanha fatiada 200g, queijo muçarela, alface, tomate e molho verde.", price: 42.9, category: "Especiais", image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Premium", popular: true },
  { id: "x-alcatra", name: "X-Alcatra", desc: "Alcatra 180g, queijo, bacon, alface, tomate e ovo.", price: 36.9, category: "Especiais", image: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Especial" },
  { id: "bauru-forno", name: "Bauru de Forno", desc: "Pão francês, presunto, muçarela, tomate, orégano, recheio cremoso gratinado no forno.", price: 29.9, category: "Clássicos", image: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Forno" },
  { id: "misto-quente", name: "Misto Quente", desc: "Pão de forma, presunto, muçarela e manteiga na chapa. Simples e quentinho.", price: 18.9, category: "Clássicos", image: "https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Clássico" },
  { id: "x-egg-bacon-duplo", name: "X-Egg Bacon Duplo", desc: "2x carne 180g, queijo duplo, 2 ovos, bacon extra, alface e tomate.", price: 41.9, category: "Especiais", image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Duplo" },
  { id: "bauru-duplo", name: "Bauru Duplo", desc: "Dobro de presunto e muçarela, tomate, alface, orégano no pão francês prensado.", price: 32.9, category: "Clássicos", image: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Duplo" },
  { id: "x-frango", name: "X-Frango Crocante", desc: "Filé de frango empanado 150g, queijo, alface, tomate e molho especial da casa.", price: 31.9, category: "Frango", image: "https://images.unsplash.com/photo-1606756790138-261d2b21cd75?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Frango" },
  { id: "x-frango-bacon", name: "X-Frango Bacon", desc: "Frango empanado, bacon crocante, cheddar, alface e tomate.", price: 36.9, category: "Frango", image: "https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Frango" },
  { id: "x-frango-cheddar", name: "X-Frango Cheddar Bacon", desc: "Frango empanado, cheddar cremoso, bacon, alface e maionese verde.", price: 37.9, category: "Frango", image: "https://images.unsplash.com/photo-1585237672814-8f85a8118bf6?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Frango", popular: true },
  { id: "x-frango-tudo", name: "X-Frango Tudo", desc: "Frango empanado, queijo, bacon, ovo, alface, tomate, milho e palha.", price: 39.9, category: "Frango", image: "https://images.unsplash.com/photo-1593504049359-74330189a345?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Completo" },
  { id: "x-tudo", name: "X-Tudo", desc: "Carne 180g, queijo duplo, bacon, ovo, alface, tomate, milho, ervilha e batata palha.", price: 39.9, category: "Especiais", image: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Especial", popular: true },
  { id: "x-tudo-duplo", name: "X-Tudo Duplo", desc: "2x carne 180g, queijo duplo, bacon, ovo, calabresa, alface, tomate e palha. Gigante.", price: 46.9, category: "Especiais", image: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Especial", popular: true },
  { id: "boka-brabo-m", name: "Boka Brabo", desc: "Blend angus 200g, muçarela, cebola caramelizada, picles e molho brabo picante.", price: 38.9, category: "Especiais", image: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Exclusivo", popular: true },
  { id: "duplo-cheddar", name: "Duplo Cheddar Bacon", desc: "2x carne 180g, cheddar cremoso em dobro, bacon crocante e pão australiano.", price: 44.9, category: "Especiais", image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Especial" },
  { id: "dog-prensado", name: "Dog Prensado", desc: "Salsicha, purê, milho, ervilha, batata palha e queijo prensado na chapa.", price: 22.9, category: "Dogs", image: "https://images.unsplash.com/photo-1552895638-f7fe08d2f7d5?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Dog" },
  { id: "dog-duplo", name: "Dog Duplo Especial", desc: "2 salsichas, bacon, cheddar, purê, milho, palha e queijo prensado.", price: 28.9, category: "Dogs", image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Dog" },
  { id: "dog-calabresa", name: "Dog Calabresa", desc: "Salsicha, calabresa fatiada, purê, vinagrete, palha e queijo.", price: 26.9, category: "Dogs", image: "https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Dog" },
  { id: "batata-p", name: "Batata Frita P", desc: "Batata crocante 300g. Acompanha maionese da casa.", price: 22.9, category: "Porções", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Porção" },
  { id: "batata-g", name: "Batata G com Cheddar e Bacon", desc: "Batata frita 500g com cheddar cremoso, bacon crocante e cebolinha.", price: 32.9, category: "Porções", image: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Porção", popular: true },
  { id: "batata-recheada", name: "Batata Recheada", desc: "Batata recheada com cheddar, bacon, calabresa e cebolinha. 500g.", price: 36.9, category: "Porções", image: "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Porção" },
  { id: "onion-rings", name: "Onion Rings", desc: "Anéis de cebola empanados e crocantes, 300g. Molho barbecue.", price: 24.9, category: "Porções", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Porção" },
  { id: "porcao-calabresa", name: "Calabresa com Fritas", desc: "Calabresa fatiada 300g + fritas 300g + pão e vinagrete.", price: 42.9, category: "Porções", image: "https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Porção", popular: true },
  { id: "porcao-frango", name: "Frango a Passarinho", desc: "Frango a passarinho crocante 500g + fritas + molho da casa.", price: 44.9, category: "Porções", image: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Porção" },
  { id: "porcao-contrafile", name: "Contra Filé com Fritas", desc: "Contra filé fatiado 400g + fritas 400g + farofa e vinagrete.", price: 62.9, category: "Parrilla", image: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Parrilla" },
  { id: "porcao-picanha", name: "Picanha na Chapa", desc: "Picanha fatiada 400g + fritas + farofa + pão com alho. Serve 2.", price: 89.9, category: "Parrilla", image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Premium" },
  { id: "coca-lata", name: "Coca-Cola Lata 350ml", desc: "Lata gelada, estupidamente gelada.", price: 6.0, category: "Bebidas", image: "https://images.unsplash.com/photo-1624552184280-9e9631bbeee9?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Bebida" },
  { id: "coca-2l", name: "Coca-Cola 2L", desc: "Geladinha para acompanhar. Bem gelada.", price: 12.0, category: "Bebidas", image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Bebida" },
  { id: "guarana-2l", name: "Guaraná Antarctica 2L", desc: "Refrigerante brasileiro clássico.", price: 11.0, category: "Bebidas", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Bebida" },
  { id: "fanta-2l", name: "Fanta Laranja 2L", desc: "Refrigerante laranja gelado.", price: 11.0, category: "Bebidas", image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Bebida" },
  { id: "agua-500", name: "Água Mineral 500ml", desc: "Com ou sem gás.", price: 4.0, category: "Bebidas", image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Bebida" },
  { id: "suco-laranja-500", name: "Suco Natural 500ml", desc: "Laranja, maracujá ou abacaxi. Natural e gelado.", price: 9.9, category: "Bebidas", image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Natural" },
  { id: "milkshake", name: "Milkshake 400ml", desc: "Cremoso e gelado. Sabores: chocolate, morango ou ovomaltine.", price: 16.9, category: "Bebidas", image: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Bebida" },
  { id: "acai-500", name: "Açaí 500ml", desc: "Açaí com banana, granola e leite em pó.", price: 18.9, category: "Sobremesas", image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Sobremesa" },
  { id: "cerveja-heineken", name: "Heineken Long Neck 330ml", desc: "Cerveja gelada.", price: 7.5, category: "Bebidas", image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Bebida" },
  { id: "combo-casal", name: "Combo Casal", desc: "2 X-Saladas + batata P + Guaraná 1L. Ideal para dois.", price: 68.9, category: "Combos", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Combo", popular: true },
  { id: "combo-familia", name: "Combo Família", desc: "4 X-Saladas + batata G com cheddar + 2L refrigerante.", price: 129.9, category: "Combos", image: "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Combo", popular: true },
  { id: "combo-galera", name: "Combo Galera", desc: "6 X-Saladas + 2 Batatas G + 2x 2L. Para a galera toda.", price: 189.9, category: "Combos", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80&auto=format&fit=crop&crop=center", badge: "Combo" },
];
