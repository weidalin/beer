<template>
  <view class="page-container">
    <scroll-view scroll-y class="form-scroll">
      <view class="form-body card" style="margin: 24rpx;">

        <!-- 产品主图 -->
        <view class="form-item">
          <text class="form-label">产品主图</text>
          <ImageUploader v-model="coverImages" :max-count="1" bucket="products" hint="建议比例 1:1，清晰展示产品" />
        </view>

        <!-- 详情图 -->
        <view class="form-item">
          <text class="form-label">详情图（最多4张）</text>
          <ImageUploader v-model="form.images" :max-count="4" bucket="products" />
        </view>

        <!-- 产品名称 -->
        <view class="form-item">
          <text class="form-label">产品名称 <text class="required">*</text></text>
          <input
            class="form-input"
            v-model="form.name"
            placeholder="输入产品名称"
            placeholder-class="form-placeholder"
            confirm-type="done"
            :adjust-position="true"
            :hold-keyboard="false"
            @confirm="blurKeyboard"
          />
        </view>

        <!-- 产品分类 -->
        <view class="form-item">
          <text class="form-label">产品分类 <text class="required">*</text></text>
          <picker :value="categoryIndex" :range="categoryOptions" range-key="label" @change="onCategoryChange">
            <view class="picker-row">
              <text class="picker-value">{{ categoryOptions[categoryIndex]?.label || '请选择分类' }}</text>
              <text class="picker-arrow">›</text>
            </view>
          </picker>
        </view>

        <!-- 规格说明 -->
        <view class="form-item">
          <text class="form-label">规格说明</text>
          <input
            class="form-input"
            v-model="form.spec"
            placeholder="如：30L / 50L，或制冷功率1200W"
            placeholder-class="form-placeholder"
            confirm-type="done"
            :adjust-position="true"
            :hold-keyboard="false"
            @confirm="blurKeyboard"
          />
        </view>

        <!-- 参考价格 -->
        <view class="form-item">
          <text class="form-label">参考价格</text>
          <input
            class="form-input"
            v-model="form.price_range"
            placeholder="如：面议 或 ¥800-1200/桶"
            placeholder-class="form-placeholder"
            confirm-type="done"
            :adjust-position="true"
            :hold-keyboard="false"
            @confirm="blurKeyboard"
          />
        </view>

        <!-- 供货方式（仅设备类显示） -->
        <view class="form-item" v-if="form.category && form.category !== 'beer'">
          <text class="form-label">供货方式</text>
          <view class="radio-group">
            <view
              v-for="opt in supplyOptions"
              :key="opt.value"
              class="radio-item"
              :class="{ 'radio-item--active': form.supply_type === opt.value }"
              @tap="form.supply_type = opt.value"
            >{{ opt.label }}</view>
          </view>
        </view>

        <!-- 产品描述 -->
        <view class="form-item">
          <text class="form-label">产品描述</text>
          <textarea
            class="form-textarea"
            v-model="form.description"
            placeholder="详细描述产品特点、适用场景等..."
            placeholder-class="form-placeholder"
            :auto-height="true"
            :show-confirm-bar="false"
            :adjust-position="true"
            :hold-keyboard="false"
            maxlength="1000"
            @blur="blurKeyboard"
          />
        </view>

        <!-- 标签 -->
        <view class="form-item">
          <text class="form-label">标签</text>
          <view class="tag-group">
            <view
              v-for="tag in tagOptions"
              :key="tag.value"
              class="tag-item"
              :class="{ 'tag-item--active': form.tags?.includes(tag.value) }"
              @tap="toggleTag(tag.value)"
            >{{ tag.label }}</view>
          </view>
        </view>

        <!-- 排序权重 -->
        <view class="form-item">
          <text class="form-label">排序权重（数字越大越靠前）</text>
          <input
            class="form-input"
            v-model.number="form.sort_order"
            type="digit"
            placeholder="0"
            placeholder-class="form-placeholder"
            confirm-type="done"
            :adjust-position="true"
            :hold-keyboard="false"
            @confirm="blurKeyboard"
          />
        </view>

        <!-- 上架状态 -->
        <view class="form-item" style="border-bottom: none;">
          <text class="form-label">上架状态</text>
          <view class="radio-group">
            <view
              class="radio-item"
              :class="{ 'radio-item--active': form.is_active }"
              @tap="form.is_active = true"
            >立即上架</view>
            <view
              class="radio-item"
              :class="{ 'radio-item--active': !form.is_active }"
              @tap="form.is_active = false"
            >暂存草稿</view>
          </view>
        </view>
      </view>

      <view class="scroll-bottom-spacer"></view>
    </scroll-view>

    <!-- 底部保存：用 view 替代原生 button，避免抢焦点/弹出键盘 -->
    <view class="bottom-bar" @touchstart.stop="blurKeyboard">
      <view
        class="btn-primary save-btn"
        :class="{ 'save-btn--disabled': saving }"
        @tap.stop="onSaveTap"
      >
        {{ saving ? '保存中...' : (isEdit ? '保存修改' : '创建产品') }}
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import ImageUploader from '../../../components/ImageUploader/index.vue'
import { useProducts } from '../../../composables/useProducts'
import type { Product } from '../../../types/database'

const { fetchProductDetail, createProduct, updateProduct } = useProducts()

const saving = ref(false)
const productId = ref<string | null>(null)
const isEdit = computed(() => !!productId.value)

const coverImages = ref<string[]>([])

type ProductForm = Omit<Partial<Product>, '_id' | 'created_at' | 'updated_at'>

const form = reactive<ProductForm>({
  name: '',
  category: 'beer',
  description: '',
  spec: '',
  price_range: '面议',
  supply_type: 'both',
  images: [],
  is_active: true,
  sort_order: 0,
  tags: []
})

const categoryOptions = [
  { label: '桶装鲜啤', value: 'beer' },
  { label: '打酒机', value: 'beer_machine' },
  { label: '啤酒车', value: 'beer_car' }
]

const categoryIndex = computed(() => {
  return categoryOptions.findIndex(c => c.value === form.category)
})

function onCategoryChange(e: { detail: { value: number } }) {
  form.category = categoryOptions[e.detail.value].value as Product['category']
}

const supplyOptions = [
  { label: '出售', value: 'sell' },
  { label: '租赁', value: 'rent' },
  { label: '出售/租赁均可', value: 'both' }
]

const tagOptions = [
  { label: '🔥 热销', value: 'hot' },
  { label: '🆕 新品', value: 'new' },
  { label: '⭐ 推荐', value: 'recommend' }
]

function toggleTag(tag: string) {
  const tags = form.tags || []
  const idx = tags.indexOf(tag)
  if (idx >= 0) tags.splice(idx, 1)
  else tags.push(tag)
  form.tags = [...tags]
}

onLoad(async (options) => {
  if (options?.id) {
    productId.value = options.id as string
    const product = await fetchProductDetail(options.id as string)
    if (product) {
      Object.assign(form, product)
      if (product.cover_image) {
        coverImages.value = [product.cover_image]
      }
    }
  }
})

function validate(): string | null {
  if (!form.name?.trim()) return '请填写产品名称'
  if (!form.category) return '请选择产品分类'
  return null
}

function blurKeyboard() {
  uni.hideKeyboard()
}

function onSaveTap() {
  if (saving.value) return
  blurKeyboard()
  void save()
}

async function save() {
  const err = validate()
  if (err) {
    uni.showToast({ title: err, icon: 'none' })
    return
  }

  saving.value = true
  try {
    const payload: Partial<Product> = {
      ...form,
      cover_image: coverImages.value[0] || null
    }

    if (isEdit.value) {
      await updateProduct(productId.value!, payload as Partial<Product>)
      uni.showToast({ title: '保存成功', icon: 'success' })
    } else {
      await createProduct(payload as Partial<Product>)
      uni.showToast({ title: '创建成功', icon: 'success' })
    }

    setTimeout(() => {
      uni.navigateBack()
    }, 1200)
  } catch (e) {
    const title =
      e instanceof Error
        ? e.message.includes('无管理员')
          ? `${e.message}，请部署 productAdmin 云函数`
          : e.message
        : '保存失败，请重试'
    uni.showToast({ title, icon: 'none', duration: 4000 })
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $color-bg;
}

.form-scroll {
  flex: 1;
  height: 0;
}

.scroll-bottom-spacer {
  height: calc(200rpx + env(safe-area-inset-bottom));
}

.form-body {
  .form-item {
    padding: $spacing-md 0;
    border-bottom: 1rpx solid $color-border-light;
  }

  .form-label {
    display: block;
    font-size: $font-sm;
    color: $color-text-secondary;
    margin-bottom: $spacing-xs;

    .required { color: $color-danger; }
  }

  .form-input {
    height: 72rpx;
    font-size: $font-base;
    color: $color-text-primary;
    border-bottom: 1rpx solid $color-border;
    width: 100%;
  }

  .form-placeholder { color: $color-text-placeholder; }

  .picker-row {
    display: flex;
    align-items: center;
    height: 72rpx;
    border-bottom: 1rpx solid $color-border;

    .picker-value { flex: 1; font-size: $font-base; color: $color-text-primary; }
    .picker-arrow { color: $color-text-placeholder; font-size: $font-xl; }
  }

  .radio-group {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    margin-top: $spacing-xs;

    .radio-item {
      padding: $spacing-xs $spacing-sm;
      border: 2rpx solid $color-border;
      border-radius: $radius-full;
      font-size: $font-sm;
      color: $color-text-secondary;

      &--active {
        border-color: $color-primary;
        color: $color-primary;
        background: $color-primary-light;
        font-weight: 600;
      }
    }
  }

  .form-textarea {
    width: 100%;
    min-height: 160rpx;
    font-size: $font-base;
    color: $color-text-primary;
    border: 1rpx solid $color-border;
    border-radius: $radius-sm;
    padding: $spacing-sm;
    margin-top: $spacing-xs;
  }

  .tag-group {
    display: flex;
    gap: $spacing-xs;
    flex-wrap: wrap;
    margin-top: $spacing-xs;

    .tag-item {
      padding: $spacing-xs $spacing-sm;
      border: 2rpx solid $color-border;
      border-radius: $radius-full;
      font-size: $font-sm;
      color: $color-text-secondary;

      &--active {
        border-color: $color-danger;
        color: $color-danger;
        background: rgba(232, 76, 61, 0.08);
      }
    }
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: $spacing-sm $spacing-md;
  padding-bottom: calc(#{$spacing-sm} + env(safe-area-inset-bottom));
  background: $color-bg-card;
  box-shadow: 0 -2rpx 16rpx rgba(0, 0, 0, 0.08);
}

.save-btn {
  width: 100%;

  &--disabled {
    opacity: 0.65;
    pointer-events: none;
  }
}
</style>
