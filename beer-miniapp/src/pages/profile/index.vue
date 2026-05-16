<template>
  <!-- 不用 scroll-view：微信端 scroll-y 必须给 scroll-view 固定高度，否则常见「中间整块空白」 -->
  <view class="page-container profile-root">
      <!-- 用户信息 -->
      <view class="user-header">
        <view v-if="userStore.isLoggedIn" class="user-info">
          <image
            class="user-avatar"
            :src="userStore.user?.avatar_url || '/static/images/default-avatar.png'"
            mode="aspectFill"
          />
          <view>
            <text class="user-name">{{ userStore.user?.nickname || '微信用户' }}</text>
            <text class="user-role" v-if="userStore.isAdmin">管理员</text>
          </view>
        </view>

        <view v-else class="user-login" @tap="doLogin">
          <image class="user-avatar" src="/static/images/default-avatar.png" mode="aspectFill" />
          <view>
            <text class="user-name">点击登录</text>
            <text class="user-login-hint">登录后可查看预约和工单记录</text>
          </view>
        </view>
      </view>

      <!-- 我的记录（已登录才显示） -->
      <view v-if="userStore.isLoggedIn" class="section-card card" style="margin: 24rpx 24rpx 16rpx;">
        <text class="section-title">我的记录</text>
        <view class="list-item" style="border-bottom: none;" @tap="goIntentions">
          <text class="list-icon">📋</text>
          <text class="list-label">我的合作意向</text>
          <text class="list-arrow">›</text>
        </view>
      </view>

      <!-- 联系我们 -->
      <view class="section-card card" style="margin: 0 24rpx 16rpx;">
        <text class="section-title">联系我们</text>
        <view class="list-item" @tap="appStore.callPhone()">
          <text class="list-icon">📞</text>
          <text class="list-label">拨打电话</text>
          <text class="list-meta">{{ appStore.contactPhone }}</text>
          <text class="list-arrow">›</text>
        </view>
        <button class="list-item-btn" open-type="contact" style="border-bottom: none;">
          <text class="list-icon">💬</text>
          <text class="list-label">微信客服</text>
          <text class="list-arrow">›</text>
        </button>
      </view>

      <!-- 关于 -->
      <view class="section-card card" style="margin: 0 24rpx 16rpx;">
        <text class="section-title">关于</text>
        <view class="list-item" @tap="goAbout">
          <text class="list-icon">📄</text>
          <text class="list-label">关于我们</text>
          <text class="list-arrow">›</text>
        </view>
        <view class="list-item" @tap="goFaq">
          <text class="list-icon">❓</text>
          <text class="list-label">常见问题</text>
          <text class="list-arrow">›</text>
        </view>
        <view class="list-item" style="border-bottom: none;" @tap="shareApp">
          <text class="list-icon">🔗</text>
          <text class="list-label">分享小程序</text>
          <text class="list-arrow">›</text>
        </view>
      </view>

      <!-- 供应商后台入口（仅 admin 可见） -->
      <view
        v-if="userStore.isAdmin"
        class="admin-entry"
        @tap="goAdmin"
      >
        <text class="admin-icon">⚙️</text>
        <text class="admin-label">进入供应商管理后台</text>
        <text class="admin-arrow">›</text>
      </view>

      <!-- 退出登录 -->
      <view v-if="userStore.isLoggedIn" class="logout-btn" @tap="logout">
        退出登录
      </view>

      <view style="height: 48rpx;"></view>
  </view>
</template>

<script setup lang="ts">
import { onShareAppMessage, onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../stores/user'
import { useAppStore } from '../../stores/app'
import { useAuth, type WxLoginProfile } from '../../composables/useAuth'

const userStore = useUserStore()
const appStore = useAppStore()
const { wxLogin, logout: doLogout, syncUserFromCloud } = useAuth()

onShow(() => {
  if (userStore.isLoggedIn) {
    void syncUserFromCloud()
  }
})

async function doLogin() {
  let profile: WxLoginProfile | undefined
  try {
    const prof = await new Promise<UniApp.GetUserProfileRes>((resolve, reject) => {
      uni.getUserProfile({
        desc: '用于展示昵称头像并保存到会员资料',
        success: resolve,
        fail: reject
      })
    })
    const u = prof.userInfo
    profile = {
      nickName: u.nickName,
      avatarUrl: u.avatarUrl
    }
  } catch {
    // 用户拒绝授权时仍可仅用 openid 登录；昵称头像保持空或由后续业务补充
  }

  try {
    uni.showLoading({ title: '登录中...' })
    await wxLogin(profile)
    uni.hideLoading()
    uni.showToast({ title: '登录成功', icon: 'success' })
  } catch (e) {
    uni.hideLoading()
    const title = e instanceof Error ? e.message : '登录失败，请重试'
    uni.showToast({ title, icon: 'none', duration: 4000 })
  }
}

function logout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) doLogout()
    }
  })
}

function goIntentions() {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  uni.switchTab({ url: '/pages/booking/index' })
}

function goAbout() {
  uni.navigateTo({ url: '/pages/about/index' })
}

function goFaq() {
  uni.navigateTo({ url: '/pages/faq/index' })
}

function goAdmin() {
  uni.navigateTo({ url: '/pages/admin/index/index' })
}

function shareApp() {
  uni.showShareMenu({ withShareTicket: true })
}

onShareAppMessage(() => ({
  title: '精酿啤酒一站式供应链 — 鲜啤直供，珠三角当日达',
  path: '/pages/index/index'
}))
</script>

<style lang="scss" scoped>
.profile-root.page-container {
  min-height: 100vh;
  background: $color-bg;
  padding-bottom: calc(#{$spacing-lg} + env(safe-area-inset-bottom));
}

// 用户头部
.user-header {
  background: $color-primary-dark;
  padding: $spacing-xl $spacing-lg;
  padding-top: calc(#{$spacing-xl} + env(safe-area-inset-top));

  .user-info,
  .user-login {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  .user-avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    border: 4rpx solid rgba(255, 255, 255, 0.3);
  }

  .user-name {
    display: block;
    font-size: $font-xl;
    font-weight: 700;
    color: $color-text-white;
  }

  .user-role {
    display: inline-block;
    margin-top: 4rpx;
    padding: 2rpx 16rpx;
    background: $color-primary;
    border-radius: $radius-full;
    font-size: $font-xs;
    color: $color-text-white;
  }

  .user-login-hint {
    display: block;
    font-size: $font-sm;
    color: rgba(255, 255, 255, 0.6);
    margin-top: 4rpx;
  }
}

// 区块卡片
.section-card {
  .section-title {
    display: block;
    font-size: $font-sm;
    color: $color-text-secondary;
    margin-bottom: $spacing-xs;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 2rpx;
  }

  .list-item,
  .list-item-btn {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-md 0;
    border-bottom: 1rpx solid $color-border-light;
    background: transparent;
    border-radius: 0;
    line-height: 1;

    &::after { border: none; }

    .list-icon { font-size: 36rpx; }
    .list-label { flex: 1; font-size: $font-base; color: $color-text-primary; }
    .list-meta { font-size: $font-sm; color: $color-text-secondary; margin-right: $spacing-xs; }
    .list-arrow { color: $color-text-placeholder; font-size: $font-xl; }
  }
}

// 管理入口
.admin-entry {
  margin: 0 $spacing-md $spacing-md;
  padding: $spacing-md;
  background: $color-primary-dark;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  .admin-icon { font-size: 36rpx; }
  .admin-label { flex: 1; font-size: $font-base; color: $color-text-white; font-weight: 600; }
  .admin-arrow { color: $color-primary; font-size: $font-xl; }
}

// 退出登录
.logout-btn {
  margin: 0 $spacing-md;
  padding: $spacing-md;
  text-align: center;
  font-size: $font-base;
  color: $color-danger;
  background: $color-bg-card;
  border-radius: $radius-md;
}
</style>
