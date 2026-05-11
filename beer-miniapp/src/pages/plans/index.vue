<template>
  <view class="page-container">
    <scroll-view scroll-y>
      <!-- 页头 -->
      <view class="plans-header">
        <text class="plans-title">选择适合你的合作方案</text>
        <text class="plans-subtitle">免押金起步 · 灵活合作 · 专属服务</text>
      </view>

      <!-- 方案切换 Tab -->
      <view class="plan-tabs">
        <view
          v-for="plan in plans"
          :key="plan.level"
          class="plan-tab"
          :class="{ 'plan-tab--active': activeLevel === plan.level }"
          @tap="activeLevel = plan.level"
        >
          {{ plan.name }}
        </view>
      </view>

      <!-- 方案详情卡片 -->
      <view class="plan-detail" v-if="activePlan">
        <view class="plan-card" :class="`plan-card--${activePlan.level}`">
          <view class="plan-card-header">
            <text class="plan-level-badge">{{ levelEmoji[activePlan.level] }}</text>
            <text class="plan-name">{{ activePlan.name }}</text>
          </view>
          <text class="plan-desc">{{ activePlan.description }}</text>

          <!-- 包含项 -->
          <view class="plan-features">
            <view class="features-label">✅ 包含以下服务：</view>
            <view
              class="feature-item"
              v-for="feature in activePlan.features"
              :key="feature"
            >
              <text class="feature-check">✓</text>
              <text class="feature-text">{{ feature }}</text>
            </view>
          </view>

          <!-- 不含项 -->
          <view class="plan-excluded" v-if="activePlan.excluded?.length">
            <view class="excluded-label">📌 不包含：</view>
            <view
              class="excluded-item"
              v-for="item in activePlan.excluded"
              :key="item"
            >
              <text class="excluded-dot">•</text>
              <text class="excluded-text">{{ item }}</text>
            </view>
          </view>

          <button class="plan-select-btn btn-primary" @tap="selectPlan(activePlan.level)">
            我要选择{{ activePlan.name }}
          </button>
        </view>
      </view>

      <!-- 啤酒车独立选配说明 -->
      <view class="beer-car-tip card" style="margin: 0 24rpx 24rpx;">
        <view class="tip-header">
          <text class="tip-icon">🍺</text>
          <text class="tip-title">啤酒车独立选配</text>
        </view>
        <text class="tip-desc">
          所有合作方案均可按需搭配啤酒车，支持购买或租赁，价格面议。<br />
          啤酒车不与任何方案强绑定，可单独咨询。
        </text>
        <button class="btn-outline tip-btn" style="margin-top: 24rpx;" @tap="goBeerCar">
          了解啤酒车详情
        </button>
      </view>

      <!-- 方案对比表 -->
      <view class="compare-section">
        <text class="compare-title">方案对比</text>
        <scroll-view scroll-x class="compare-scroll">
          <view class="compare-table">
            <!-- 表头 -->
            <view class="compare-row compare-row--header">
              <view class="compare-cell compare-cell--label"></view>
              <view class="compare-cell" v-for="plan in plans" :key="plan.level">
                <text class="compare-plan-name">{{ plan.name }}</text>
              </view>
            </view>
            <!-- 对比项 -->
            <view class="compare-row" v-for="item in compareItems" :key="item.label">
              <view class="compare-cell compare-cell--label">{{ item.label }}</view>
              <view class="compare-cell" v-for="plan in plans" :key="plan.level">
                <text :class="{ 'compare-value--highlight': item.values[plan.level]?.includes('✓') }">
                  {{ item.values[plan.level] || '—' }}
                </text>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 常见问题 -->
      <view class="faq-section">
        <text class="faq-title">常见疑问</text>
        <view class="faq-list">
          <view
            class="faq-item card"
            v-for="faq in faqs"
            :key="faq.q"
            @tap="faq.open = !faq.open"
          >
            <view class="faq-header">
              <text class="faq-q">Q: {{ faq.q }}</text>
              <text class="faq-arrow">{{ faq.open ? '▲' : '▼' }}</text>
            </view>
            <text v-if="faq.open" class="faq-a">{{ faq.a }}</text>
          </view>
        </view>
      </view>

      <view style="height: 48rpx;"></view>
    </scroll-view>

    <FloatContact />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { onShareAppMessage } from '@dcloudio/uni-app'
import FloatContact from '../../components/FloatContact/index.vue'
import { usePlans } from '../../composables/usePlans'
import type { Plan } from '../../types/database'

const { fetchPlans } = usePlans()

const plans = ref<Plan[]>([])
const activeLevel = ref<'basic' | 'standard' | 'premium'>('standard')

const activePlan = computed(() => plans.value.find(p => p.level === activeLevel.value))

const levelEmoji: Record<string, string> = {
  basic: '🌱',
  standard: '⭐',
  premium: '👑'
}

const compareItems = [
  {
    label: '配送频次',
    values: { basic: '每周1次', standard: '每周2次', premium: '每日配送' }
  },
  {
    label: '打酒机',
    values: { basic: '—', standard: '✓ 含1台', premium: '✓ 含1台' }
  },
  {
    label: '维修响应',
    values: { basic: '72小时', standard: '48小时', premium: '4小时' }
  },
  {
    label: '押金',
    values: { basic: '免押金', standard: '免押金', premium: '免押金' }
  },
  {
    label: '专属客服',
    values: { basic: '—', standard: '✓', premium: '✓ 专属经理' }
  },
  {
    label: '设备保养',
    values: { basic: '—', standard: '—', premium: '✓ 定期保养' }
  }
]

const faqs = reactive([
  { q: '押金是多少？', a: '所有方案均免押金起步，签约后即可开始合作。', open: false },
  { q: '合同期多长？', a: '合同期灵活，最短3个月起，具体可与业务沟通。', open: false },
  { q: '啤酒车怎么选配？', a: '啤酒车独立选配，不与方案绑定。支持出售和租赁，价格面议，可联系我们咨询。', open: false },
  { q: '珠三角以外能配送吗？', a: '可以！珠三角以外地区走物流，起订量另议，欢迎联系我们了解详情。', open: false },
  { q: '打酒机坏了怎么办？', a: '标准版48小时、旗舰版4小时上门维修响应，基础版72小时内处理。', open: false }
])

onMounted(async () => {
  plans.value = await fetchPlans()
})

function selectPlan(level: string) {
  uni.navigateTo({ url: `/pages/booking/index?plan=${level}` })
}

function goBeerCar() {
  uni.navigateTo({ url: '/pages/products/list?category=beer_car' })
}

onShareAppMessage(() => ({
  title: '广东精酿啤酒一站式供应链 — 合作方案一览',
  path: '/pages/plans/index'
}))
</script>

<style lang="scss" scoped>
.page-container {
  background: $color-bg;
  min-height: 100vh;
}

// 页头
.plans-header {
  background: $color-primary-dark;
  padding: $spacing-xl $spacing-lg;
  text-align: center;

  .plans-title {
    display: block;
    font-size: $font-xl;
    font-weight: 700;
    color: $color-text-white;
    margin-bottom: $spacing-xs;
  }

  .plans-subtitle {
    font-size: $font-base;
    color: rgba(255, 255, 255, 0.7);
  }
}

// 方案 Tab
.plan-tabs {
  display: flex;
  background: $color-bg-card;
  padding: $spacing-sm $spacing-md;
  gap: $spacing-sm;

  .plan-tab {
    flex: 1;
    text-align: center;
    padding: $spacing-sm;
    border-radius: $radius-md;
    font-size: $font-base;
    color: $color-text-secondary;
    background: $color-bg;

    &--active {
      background: $color-primary;
      color: $color-text-white;
      font-weight: 600;
    }
  }
}

// 方案详情
.plan-detail {
  padding: $spacing-md;

  .plan-card {
    border-radius: $radius-lg;
    padding: $spacing-lg;
    background: $color-primary-light;
    border: 2rpx solid $color-primary;

    &--premium {
      background: linear-gradient(135deg, #FFF8F0, #FFE0B0);
      border-color: $color-primary-dark;
    }

    .plan-card-header {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      margin-bottom: $spacing-sm;

      .plan-level-badge {
        font-size: 48rpx;
      }

      .plan-name {
        font-size: $font-xxl;
        font-weight: 700;
        color: $color-primary-dark;
      }
    }

    .plan-desc {
      display: block;
      font-size: $font-base;
      color: $color-text-secondary;
      margin-bottom: $spacing-md;
    }

    .plan-features {
      margin-bottom: $spacing-md;

      .features-label {
        font-size: $font-sm;
        color: $color-text-secondary;
        margin-bottom: $spacing-xs;
      }

      .feature-item {
        display: flex;
        align-items: center;
        gap: $spacing-xs;
        padding: $spacing-xs 0;

        .feature-check {
          color: $color-success;
          font-weight: 700;
        }

        .feature-text {
          font-size: $font-base;
          color: $color-text-primary;
        }
      }
    }

    .plan-excluded {
      margin-bottom: $spacing-md;
      padding-top: $spacing-sm;
      border-top: 1rpx dashed $color-border;

      .excluded-label {
        font-size: $font-sm;
        color: $color-text-secondary;
        margin-bottom: $spacing-xs;
      }

      .excluded-item {
        display: flex;
        gap: $spacing-xs;

        .excluded-dot { color: $color-text-tertiary; }
        .excluded-text { font-size: $font-sm; color: $color-text-tertiary; }
      }
    }

    .plan-select-btn {
      width: 100%;
      margin-top: $spacing-sm;
    }
  }
}

// 方案对比表
.compare-section {
  margin: 0 $spacing-md $spacing-md;

  .compare-title {
    display: block;
    font-size: $font-lg;
    font-weight: 700;
    color: $color-text-primary;
    margin-bottom: $spacing-sm;
  }

  .compare-scroll {
    background: $color-bg-card;
    border-radius: $radius-md;
    overflow: hidden;
  }

  .compare-table {
    min-width: 640rpx;
  }

  .compare-row {
    display: flex;
    border-bottom: 1rpx solid $color-border-light;

    &:last-child { border-bottom: none; }

    &--header {
      background: $color-primary-dark;
    }
  }

  .compare-cell {
    flex: 1;
    padding: $spacing-sm;
    text-align: center;
    font-size: $font-sm;
    color: $color-text-secondary;
    display: flex;
    align-items: center;
    justify-content: center;

    &--label {
      flex: 1.2;
      text-align: left;
      font-weight: 600;
      color: $color-text-primary;
    }

    .compare-plan-name {
      color: $color-text-white;
      font-weight: 700;
      font-size: $font-base;
    }

    .compare-value--highlight {
      color: $color-success;
      font-weight: 600;
    }
  }
}

// 常见问题
.faq-section {
  padding: 0 $spacing-md $spacing-md;

  .faq-title {
    display: block;
    font-size: $font-lg;
    font-weight: 700;
    color: $color-text-primary;
    margin-bottom: $spacing-sm;
  }

  .faq-list {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  .faq-item {
    .faq-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .faq-q {
        flex: 1;
        font-size: $font-base;
        font-weight: 600;
        color: $color-text-primary;
        line-height: $line-height-base;
      }

      .faq-arrow {
        color: $color-text-tertiary;
        font-size: $font-sm;
        margin-left: $spacing-sm;
      }
    }

    .faq-a {
      display: block;
      margin-top: $spacing-sm;
      font-size: $font-base;
      color: $color-text-secondary;
      line-height: $line-height-loose;
    }
  }
}

.tip-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-sm;

  .tip-icon { font-size: 40rpx; }
  .tip-title {
    font-size: $font-lg;
    font-weight: 700;
    color: $color-text-primary;
  }
}

.tip-desc {
  font-size: $font-base;
  color: $color-text-secondary;
  line-height: $line-height-loose;
}

.tip-btn {
  width: 100%;
}
</style>
