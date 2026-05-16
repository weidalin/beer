.PHONY: dev build dev-h5 build-h5 type-check install help

# 默认目标
help:
	@echo "可用命令："
	@echo "  make dev         - 开发模式（微信小程序，热重载）"
	@echo "  make build       - 打包微信小程序（生产）"
	@echo "  make dev-h5      - 开发模式（H5）"
	@echo "  make build-h5    - 打包 H5（生产）"
	@echo "  make type-check  - TypeScript 类型检查"
	@echo "  make install     - 安装依赖"
	@echo "  make cloudfunctions - 安装云函数 npm 依赖（wx-server-sdk）"

install:
	npm install

cloudfunctions:
	node scripts/install-cloudfunctions.mjs

dev:
	npm run dev:mp-weixin

build:
	npm run build:mp-weixin

dev-h5:
	npm run dev:h5

build-h5:
	npm run build:h5

type-check:
	npm run type-check
