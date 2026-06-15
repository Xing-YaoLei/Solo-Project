<template>
  <el-container style="min-height: 100vh">
    <el-aside width="200px">
      <el-menu :default-active="$route.path" router>
        <el-menu-item index="/">
          <span>漏斗看板</span>
        </el-menu-item>
        <el-menu-item index="/threshold">
          <span>阈值配置</span>
        </el-menu-item>
        <el-menu-item index="/review">
          <span>复查素材</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>
