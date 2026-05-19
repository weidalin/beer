<template>
  <view class="page-container profile-root">
    <!-- 用户信息 -->
    <view class="user-header">
      <view v-if="userStore.isLoggedIn" class="user-info">
        <button
          class="avatar-btn"
          open-type="chooseAvatar"
          @chooseavatar="onChooseAvatar"
        >
          <image
            class="user-avatar"
            :src="avatarDisplay"
            mode="aspectFill"
          />
        </button>
        <view class="user-meta">
          <text class="user-name">{{ displayNickname }}</text>
          <text v-if="userStore.user?.phone" class="user-sub">{{ maskedPhone }}</text>
          <text
            v-if="profileIncomplete"
            class="user-complete-hint"
            @tap="openSetup"
          >点击完善资料 ›</text>
          <text class="user-role" v-if="userStore.isAdmin">管理员</text>
        </view>
      </view>

      <view v-else class="user-login" @tap="startLogin">
        <image class="user-avatar" src="/static/images/default-avatar.png" mode="aspectFill" />
        <view>
          <text class="user-name">点击登录</text>
          <text class="user-login-hint">登录后可查看预约和工单记录</text>
        </view>
      </view>
    </view>

    <!-- 我的记录 -->
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

    <view
      v-if="userStore.isAdmin"
      class="admin-entry"
      @tap="goAdmin"
    >
      <text class="admin-icon">⚙️</text>
      <text class="admin-label">进入供应商管理后台</text>
      <text class="admin-arrow">›</text>
    </view>

    <view v-if="userStore.isLoggedIn" class="logout-btn" @tap="logout">
      退出登录
    </view>

    <view style="height: 48rpx;"></view>

    <!-- 登录 / 完善资料弹层 -->
    <view v-if="showSetup" class="setup-mask" @tap.self="closeSetup">
      <view class="setup-panel" @tap.stop>
        <text class="setup-title">{{ userStore.isLoggedIn ? '完善资料' : '登录并完善资料' }}</text>
        <text class="setup-desc">授权后将自动保存昵称与手机号</text>

        <view class="setup-field">
          <text class="setup-label">微信昵称</text>
          <input
            id="setup-nickname-input"
            class="setup-input setup-nickname-input"
            type="nickname"
            :value="setupForm.nickname"
            :disabled="nicknameSaved"
            placeholder="点击使用微信昵称"
            placeholder-class="setup-placeholder"
            @input="onNicknameInput"
            @change="onNicknameInput"
            @blur="onNicknameBlur"
            @nicknamereview="onNicknameReview"
          />
          <text v-if="nicknameSaved" class="setup-ok">已保存</text>
        </view>

        <view class="setup-field">
          <text class="setup-label">手机号</text>
          <text v-if="setupPhoneDisplay" class="setup-phone-value">{{ setupPhoneDisplay }}</text>
          <button
            v-else
            class="setup-phone-btn"
            open-type="getPhoneNumber"
            :disabled="savingPhone"
            @getphonenumber="onGetPhoneNumber"
          >
            {{ savingPhone ? '保存中...' : '微信授权手机号' }}
          </button>
          <text v-if="setupPhoneDisplay" class="setup-ok">已保存</text>
        </view>

        <view class="setup-actions setup-actions--single">
          <text class="setup-cancel" @tap="closeSetup">稍后再说</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, getCurrentInstance } from 'vue'
import { onShareAppMessage, onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../stores/user'
import { useAppStore } from '../../stores/app'
import { useAuth, needsProfileSetup } from '../../composables/useAuth'
import { maskPhone } from '../../utils/format'

const userStore = useUserStore()
const appStore = useAppStore()
const { wxLogin, saveUserProfile, logout: doLogout, syncUserFromCloud } = useAuth()

const showSetup = ref(false)
const setupDismissed = ref(false)
const savingNick = ref(false)
const savingPhone = ref(false)

const setupForm = reactive({
  nickname: ''
})

const profileIncomplete = computed(() => needsProfileSetup(userStore.user))

const displayNickname = computed(() => {
  const n = userStore.user?.nickname?.trim()
  if (n && n !== '微信用户') return n
  if (userStore.isLoggedIn) return '未设置昵称'
  return '点击登录'
})

const avatarDisplay = computed(
  () => userStore.user?.avatar_url || '/static/images/default-avatar.png'
)

const maskedPhone = computed(() => {
  const p = userStore.user?.phone
  return p ? maskPhone(p) : ''
})

const nicknameSaved = computed(() => {
  const n = userStore.user?.nickname?.trim()
  return !!n && n !== '微信用户'
})

const setupPhoneDisplay = computed(() => {
  const p = userStore.user?.phone?.trim()
  return p ? maskPhone(p) : ''
})

onShow(() => {
  if (!userStore.isLoggedIn) {
    showSetup.value = false
    return
  }
  void syncUserFromCloud().then(() => {
    if (!needsProfileSetup(userStore.user)) {
      showSetup.value = false
      return
    }
    if (!setupDismissed.value) {
      prefillSetup()
      showSetup.value = true
    }
  })
})

function prefillSetup() {
  const u = userStore.user
  setupForm.nickname = u?.nickname?.trim() && u.nickname !== '微信用户' ? u.nickname : ''
}

function openSetup() {
  prefillSetup()
  showSetup.value = true
}

function closeSetup() {
  showSetup.value = false
  setupDismissed.value = true
}

async function startLogin() {
  try {
    uni.showLoading({ title: '登录中...' })
    await wxLogin()
    await syncUserFromCloud()
    uni.hideLoading()

    if (needsProfileSetup(userStore.user)) {
      setupDismissed.value = false
      prefillSetup()
      showSetup.value = true
    } else {
      showSetup.value = false
      uni.showToast({ title: '登录成功', icon: 'success' })
    }
  } catch (e) {
    uni.hideLoading()
    const title = e instanceof Error ? e.message : '登录失败，请重试'
    uni.showToast({ title, icon: 'none', duration: 4000 })
  }
}

function onChooseAvatar(e: { detail: { avatarUrl: string } }) {
  const url = e.detail?.avatarUrl
  if (!url || !userStore.isLoggedIn) return
  void (async () => {
    try {
      await saveUserProfile({ avatarUrl: url })
      uni.showToast({ title: '头像已更新', icon: 'success' })
    } catch {
      uni.showToast({ title: '头像保存失败', icon: 'none' })
    }
  })()
}

function extractPhoneCode(detail: Record<string, unknown>): string | undefined {
  const code = detail.code
  if (typeof code === 'string' && code.length > 0) return code
  return undefined
}

async function onGetPhoneNumber(e: { detail: Record<string, unknown> }) {
  const detail = e.detail || {}
  const errMsg = String(detail.errMsg || '')

  if (!errMsg.includes('getPhoneNumber:ok')) {
    if (errMsg && !errMsg.includes('cancel') && !errMsg.includes('deny')) {
      uni.showToast({ title: '授权失败，请重试', icon: 'none' })
    }
    return
  }

  const code = extractPhoneCode(detail)
  if (!code) {
    uni.showToast({
      title: '未获取到授权码，请用真机预览（模拟器不支持）',
      icon: 'none',
      duration: 4000
    })
    return
  }

  if (savingPhone.value) return
  savingPhone.value = true
  try {
    await saveUserProfile({ phoneCode: code })
    await syncUserFromCloud()
    tryFinishSetup()
  } catch (err) {
    const title = err instanceof Error ? err.message : '手机号保存失败'
    uni.showToast({ title, icon: 'none', duration: 4000 })
  } finally {
    savingPhone.value = false
  }
}

/** 微信「用微信昵称」不会走 v-model，需从事件或 DOM 读取 */
function onNicknameInput(e: { detail: { value?: string } }) {
  const v = e.detail?.value?.trim()
  if (v) setupForm.nickname = v
}

function onNicknameBlur(e: { detail: { value?: string } }) {
  const v = e.detail?.value?.trim()
  if (v) setupForm.nickname = v
  else syncNicknameFromInput()
  void persistNickname()
}

function onNicknameReview(e: { detail: { pass?: boolean } }) {
  if (e.detail?.pass !== false) {
    setTimeout(() => {
      syncNicknameFromInput()
      void persistNickname()
    }, 120)
  }
}

function syncNicknameFromInput() {
  const proxy = getCurrentInstance()?.proxy
  const query = proxy
    ? uni.createSelectorQuery().in(proxy)
    : uni.createSelectorQuery()
  query
    .select('#setup-nickname-input')
    .fields({ properties: ['value'] })
    .exec(res => {
      const row = res?.[0] as { value?: string } | undefined
      const v = row?.value?.trim()
      if (v) setupForm.nickname = v
    })
}

async function persistNickname() {
  if (savingNick.value || nicknameSaved.value) {
    tryFinishSetup()
    return
  }
  syncNicknameFromInput()
  await new Promise<void>(r => setTimeout(r, 120))
  const nickname = setupForm.nickname.trim()
  if (!nickname || nickname === '微信用户') return

  savingNick.value = true
  try {
    await saveUserProfile({ nickname })
    await syncUserFromCloud()
    setupForm.nickname = userStore.user?.nickname?.trim() || nickname
    tryFinishSetup()
  } catch (err) {
    const title = err instanceof Error ? err.message : '昵称保存失败'
    uni.showToast({ title, icon: 'none' })
  } finally {
    savingNick.value = false
  }
}

function tryFinishSetup() {
  if (!needsProfileSetup(userStore.user)) {
    showSetup.value = false
    setupDismissed.value = true
    uni.showToast({ title: '资料已保存', icon: 'success' })
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
  uni.navigateTo({ url: '/pages/my-intentions/index' })
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

  .avatar-btn {
    padding: 0;
    margin: 0;
    background: transparent;
    border: none;
    line-height: 1;
    &::after { border: none; }
  }

  .user-avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    border: 4rpx solid rgba(255, 255, 255, 0.3);
    display: block;
  }

  .user-meta {
    flex: 1;
    min-width: 0;
  }

  .user-name {
    display: block;
    font-size: $font-xl;
    font-weight: 700;
    color: $color-text-white;
  }

  .user-sub {
    display: block;
    font-size: $font-sm;
    color: rgba(255, 255, 255, 0.75);
    margin-top: 4rpx;
  }

  .user-complete-hint {
    display: block;
    font-size: $font-sm;
    color: $color-primary;
    margin-top: 8rpx;
  }

  .user-role {
    display: inline-block;
    margin-top: 8rpx;
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

.logout-btn {
  margin: 0 $spacing-md;
  padding: $spacing-md;
  text-align: center;
  font-size: $font-base;
  color: $color-danger;
  background: $color-bg-card;
  border-radius: $radius-md;
}

.setup-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: flex-end;
}

.setup-panel {
  width: 100%;
  background: $color-bg-card;
  border-radius: $radius-lg $radius-lg 0 0;
  padding: $spacing-lg $spacing-md;
  padding-bottom: calc(#{$spacing-lg} + env(safe-area-inset-bottom));
}

.setup-title {
  display: block;
  font-size: $font-lg;
  font-weight: 700;
  color: $color-text-primary;
  text-align: center;
}

.setup-desc {
  display: block;
  font-size: $font-sm;
  color: $color-text-secondary;
  text-align: center;
  margin-top: $spacing-xs;
  margin-bottom: $spacing-md;
}

.setup-avatar-row {
  display: flex;
  justify-content: center;
  margin-bottom: $spacing-md;
}

.setup-avatar-btn {
  background: transparent;
  padding: 0;
  margin: 0;
  line-height: 1;
  &::after { border: none; }

  .setup-avatar {
    width: 140rpx;
    height: 140rpx;
    border-radius: 50%;
    border: 4rpx solid $color-border;
    display: block;
  }

  .setup-avatar-tip {
    display: block;
    font-size: $font-xs;
    color: $color-primary;
    margin-top: $spacing-xs;
    text-align: center;
  }
}

.setup-field {
  margin-bottom: $spacing-md;

  .setup-label {
    display: block;
    font-size: $font-sm;
    color: $color-text-secondary;
    margin-bottom: $spacing-xs;
  }

  .setup-input {
    width: 100%;
    height: 80rpx;
    padding: 0 $spacing-sm;
    font-size: $font-base;
    border: 1rpx solid $color-border;
    border-radius: $radius-sm;
    box-sizing: border-box;
  }

  .setup-placeholder {
    color: $color-text-placeholder;
  }

  .setup-phone-btn {
    width: 100%;
    height: 80rpx;
    line-height: 80rpx;
    font-size: $font-base;
    color: $color-primary;
    background: $color-primary-light;
    border-radius: $radius-sm;
    border: 1rpx solid $color-primary;
    &::after { border: none; }
  }

  .setup-phone-value {
    display: block;
    height: 80rpx;
    line-height: 80rpx;
    padding: 0 $spacing-sm;
    font-size: $font-base;
    color: $color-text-primary;
    background: $color-bg;
    border-radius: $radius-sm;
    border: 1rpx solid $color-border;
  }

  .setup-ok {
    display: block;
    margin-top: $spacing-xs;
    font-size: $font-xs;
    color: $color-success;
  }
}

.setup-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-md;
  margin-top: $spacing-sm;

  .setup-cancel {
    font-size: $font-base;
    color: $color-text-secondary;
    padding: $spacing-sm;
  }
}
</style>
