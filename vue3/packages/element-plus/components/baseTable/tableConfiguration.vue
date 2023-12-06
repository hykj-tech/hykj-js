<template>
  <el-drawer
    title="表格配置"
    v-model="drawer"
    append-to-body
    :direction="direction">
    <div class="cp-tableConfiguration">
      <base-table
        style="height: 100%"
        :data="columnsData"
        :columns="tableColumns"
      >
        <template #item.isHide="{row}">
          <el-switch
            :model-value="!row.hide"
            @change="changeRow(row,$event)"
            :disabled="row.disabledHide"
            >
          </el-switch>
        </template>
      </base-table>
    </div>
  </el-drawer>
</template>

<script>
export default {
  components: {
    baseTable: defineAsyncComponent(() => import('./table.vue'))
  },
  data() {
    return {
      drawer: false,
      direction: 'rtl',
      tableColumns: [
        {prop:'label', label:'列名'},
        {prop:'isHide', label:'显示'},
      ]
    };
  },
  computed: {
  },
  mounted() {
  },
  methods: {
    // 开关drawer
    toggle(value){
      this.drawer = value !== undefined ? value : !this.drawer
    },
    changeRow(row, value) {
      row.hide = !value;
      this.$emit('change')
    }
  },
  watch: {},
  props: {
    columnsData: {
      type: Array,
    }
  }
};
</script>

<style scoped lang="scss">
.cp-tableConfiguration{
  height: 100%;
  padding: 15px;
}
</style>
