import type { Medicine } from '@/types/game';

const photo = (prompt: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    prompt
  )}&image_size=square_hd`;

export const MEDICINES: Medicine[] = [
  {
    id: 'cold-001',
    name: '复方氨酚烷胺片',
    category: '感冒药',
    color: '#4FC3F7',
    icon: '🤒',
    photoUrl: photo(
      '药店货架陈列的复方氨酚烷胺片感冒药包装盒，蓝色包装，整齐摆放在药店货架上，明亮的药店灯光环境，真实商品照片风格'
    ),
  },
  {
    id: 'cold-002',
    name: '感冒灵颗粒',
    category: '感冒药',
    color: '#29B6F6',
    icon: '🌡️',
    photoUrl: photo(
      '药店货架上的感冒灵颗粒冲剂包装盒，蓝白配色包装，整齐堆放在药店冷柜附近，真实药店陈列照片风格'
    ),
  },
  {
    id: 'cold-003',
    name: '连花清瘟胶囊',
    category: '感冒药',
    color: '#03A9F4',
    icon: '🤧',
    photoUrl: photo(
      '药店促销端架上的连花清瘟胶囊包装盒，红色黄色包装，端架陈列，带有促销标签，真实药店商品照片'
    ),
  },
  {
    id: 'fever-001',
    name: '布洛芬缓释胶囊',
    category: '退烧药',
    color: '#FFB74D',
    icon: '🔥',
    photoUrl: photo(
      '药店黄金陈列位置的布洛芬缓释胶囊药盒，橙色包装，摆放在显眼的货架中层，真实药品包装照片'
    ),
  },
  {
    id: 'fever-002',
    name: '对乙酰氨基酚片',
    category: '退烧药',
    color: '#FFA726',
    icon: '💊',
    photoUrl: photo(
      '药店OTC区域的对乙酰氨基酚片包装盒，橙白配色，与退烧药摆放在同一区域，真实药店货架陈列'
    ),
  },
  {
    id: 'stomach-001',
    name: '健胃消食片',
    category: '肠胃药',
    color: '#81C784',
    icon: '🍜',
    photoUrl: photo(
      '药店肠胃用药区的健胃消食片包装盒，绿色天然风格包装，摆放在木制展示架上，真实商品陈列'
    ),
  },
  {
    id: 'stomach-002',
    name: '奥美拉唑肠溶胶囊',
    category: '肠胃药',
    color: '#66BB6A',
    icon: '🫃',
    photoUrl: photo(
      '药店货架上的奥美拉唑肠溶胶囊药盒，深绿白包装，整齐排列在肠胃药品类区，真实药店陈列风格'
    ),
  },
  {
    id: 'stomach-003',
    name: '蒙脱石散',
    category: '肠胃药',
    color: '#4CAF50',
    icon: '💩',
    photoUrl: photo(
      '药店儿童用药区的蒙脱石散冲剂，浅绿包装，旁边还有其他肠胃用药，真实药店货架照片'
    ),
  },
  {
    id: 'vitamin-001',
    name: '维生素C片',
    category: '维生素',
    color: '#F06292',
    icon: '🍊',
    photoUrl: photo(
      '药店营养品区的维生素C片瓶和包装盒，橙粉色设计，与保健品摆放在一起，真实药店照片风格'
    ),
  },
  {
    id: 'vitamin-002',
    name: '复合维生素B',
    category: '维生素',
    color: '#EC407A',
    icon: '💪',
    photoUrl: photo(
      '药店保健品堆头陈列的复合维生素B瓶装，粉红健康风格，堆叠促销，真实药店促销堆头照片'
    ),
  },
  {
    id: 'vitamin-003',
    name: '钙片',
    category: '维生素',
    color: '#E91E63',
    icon: '🦴',
    photoUrl: photo(
      '药店黄金位置的中老年钙片包装，紫色设计，带有骨密度相关图示，真实药店商品照片'
    ),
  },
  {
    id: 'skincare-001',
    name: '创可贴',
    category: '外用',
    color: '#BA68C8',
    icon: '🩹',
    photoUrl: photo(
      '药店外用品区的创可贴包装盒和挂袋，卡通图案设计，挂在货架挂钩上，真实药店外用药区陈列'
    ),
  },
  {
    id: 'skincare-002',
    name: '碘伏消毒液',
    category: '外用',
    color: '#AB47BC',
    icon: '🧴',
    photoUrl: photo(
      '药店外用品货架的碘伏消毒液瓶装，棕色塑料瓶，与棉签纱布摆放在一起，真实药店陈列照片'
    ),
  },
  {
    id: 'skincare-003',
    name: '云南白药气雾剂',
    category: '外用',
    color: '#9C27B0',
    icon: '🩼',
    photoUrl: photo(
      '药店外用品区的云南白药气雾剂套装，红白色喷雾瓶，双瓶组合包装，真实药店商品陈列照片'
    ),
  },
  {
    id: 'promo-001',
    name: '买二赠一标识',
    category: '促销标识',
    color: '#FFD54F',
    icon: '🎁',
    photoUrl: photo(
      '药店促销标识牌，黄色爆炸星形状，写着买二赠一大字，红底白字，挂在货架前沿，真实POP促销牌'
    ),
  },
  {
    id: 'promo-002',
    name: '限时特惠标识',
    category: '促销标识',
    color: '#FFC107',
    icon: '⏰',
    photoUrl: photo(
      '药店限时特惠价格标签牌，橙红色火焰设计，写着限时特惠和价格数字，夹在货架上，真实药店促销价签'
    ),
  },
  {
    id: 'promo-003',
    name: '会员专享标识',
    category: '促销标识',
    color: '#FFB300',
    icon: '⭐',
    photoUrl: photo(
      '药店会员专享金色立牌，金色星星VIP设计，写着会员专享字样，放置在货架层板前端，真实药店会员标识照片'
    ),
  },
];

export const getMedicineById = (id: string): Medicine | undefined => {
  return MEDICINES.find(m => m.id === id);
};

export const getMedicinesByCategory = (category: string): Medicine[] => {
  return MEDICINES.filter(m => m.category === category);
};

export const getMedicineCategories = (): string[] => {
  return [...new Set(MEDICINES.map(m => m.category))];
};
