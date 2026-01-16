import { create } from 'zustand';
import { inventoryApi, shopApi } from '../services/api';

export interface ItemTemplate {
  id: number;
  name: string;
  description: string;
  type: string;
  subtype: string;
  rarity: string;
  level_required: number;
  // 4스탯 시스템: HP, ATK, DEF, SPD
  stat_hp: number;
  stat_atk: number;
  stat_def: number;
  stat_spd: number;
  effect_type: string | null;
  effect_value: number;
  effect_duration: number;
  capture_rate_bonus: number;
  buy_price: number;
  sell_price: number;
  stackable: boolean;
  max_stack: number;
  icon_url: string;
}

export interface InventoryItem {
  id: string;
  character_id: string;
  item_template_id: number;
  quantity: number;
  slot_index: number | null;
  enhancement_level: number;
  // 4스탯 시스템 보너스
  bonus_stat_hp: number;
  bonus_stat_atk: number;
  bonus_stat_def: number;
  bonus_stat_spd: number;
  is_equipped: boolean;
  equipped_slot: string | null;
  item_templates: ItemTemplate;
}

export interface Shop {
  id: number;
  name: string;
  description: string;
  npc_name: string;
  shop_type: string;
  icon_url: string;
}

export interface ShopItem {
  id: number;
  shop_id: number;
  item_template_id: number;
  stock: number;
  discount_percent: number;
  level_required: number;
  item_templates: ItemTemplate;
}

interface InventoryState {
  items: InventoryItem[];
  equippedItems: InventoryItem[];
  shops: Shop[];
  currentShop: Shop | null;
  shopItems: ShopItem[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchInventory: () => Promise<void>;
  fetchEquipped: () => Promise<void>;
  equipItem: (inventoryId: string) => Promise<void>;
  unequipItem: (inventoryId: string) => Promise<void>;
  consumeItem: (inventoryId: string) => Promise<{ effect: string; value: number }>;
  sellItem: (inventoryId: string, quantity?: number) => Promise<number>;
  discardItem: (inventoryId: string, quantity?: number) => Promise<void>;

  fetchShops: () => Promise<void>;
  fetchShopItems: (shopId: number) => Promise<void>;
  buyItem: (shopId: number, itemTemplateId: number, quantity?: number) => Promise<void>;
  setCurrentShop: (shop: Shop | null) => void;
  clearError: () => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  equippedItems: [],
  shops: [],
  currentShop: null,
  shopItems: [],
  isLoading: false,
  error: null,

  fetchInventory: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await inventoryApi.getAll();
      set({ items: response.data.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || '인벤토리를 불러오지 못했습니다', isLoading: false });
    }
  },

  fetchEquipped: async () => {
    try {
      const response = await inventoryApi.getEquipped();
      set({ equippedItems: response.data.data });
    } catch (error: any) {
      console.error('Failed to fetch equipped items:', error);
    }
  },

  equipItem: async (inventoryId: string) => {
    set({ isLoading: true, error: null });
    try {
      await inventoryApi.equip(inventoryId);
      await get().fetchInventory();
      await get().fetchEquipped();
    } catch (error: any) {
      set({ error: error.response?.data?.message || '장착에 실패했습니다', isLoading: false });
    }
  },

  unequipItem: async (inventoryId: string) => {
    set({ isLoading: true, error: null });
    try {
      await inventoryApi.unequip(inventoryId);
      await get().fetchInventory();
      await get().fetchEquipped();
    } catch (error: any) {
      set({ error: error.response?.data?.message || '해제에 실패했습니다', isLoading: false });
    }
  },

  consumeItem: async (inventoryId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await inventoryApi.use(inventoryId);
      await get().fetchInventory();
      set({ isLoading: false });
      return response.data.data;
    } catch (error: any) {
      set({ error: error.response?.data?.message || '사용에 실패했습니다', isLoading: false });
      throw error;
    }
  },

  sellItem: async (inventoryId: string, quantity?: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await inventoryApi.sell(inventoryId, quantity);
      await get().fetchInventory();
      set({ isLoading: false });
      return response.data.data.gold;
    } catch (error: any) {
      set({ error: error.response?.data?.message || '판매에 실패했습니다', isLoading: false });
      throw error;
    }
  },

  discardItem: async (inventoryId: string, quantity?: number) => {
    set({ isLoading: true, error: null });
    try {
      await inventoryApi.discard(inventoryId, quantity);
      await get().fetchInventory();
    } catch (error: any) {
      set({ error: error.response?.data?.message || '버리기에 실패했습니다', isLoading: false });
    }
  },

  fetchShops: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await shopApi.getAll();
      set({ shops: response.data.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || '상점을 불러오지 못했습니다', isLoading: false });
    }
  },

  fetchShopItems: async (shopId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await shopApi.getItems(shopId);
      set({ shopItems: response.data.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || '상점 아이템을 불러오지 못했습니다', isLoading: false });
    }
  },

  buyItem: async (shopId: number, itemTemplateId: number, quantity?: number) => {
    set({ isLoading: true, error: null });
    try {
      await shopApi.buy(shopId, itemTemplateId, quantity);
      await get().fetchInventory();
      await get().fetchShopItems(shopId);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || '구매에 실패했습니다', isLoading: false });
      throw error;
    }
  },

  setCurrentShop: (shop) => set({ currentShop: shop }),
  clearError: () => set({ error: null }),
}));
