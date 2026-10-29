<template>
  <div>
    <a-alert type="info" show-icon class="mb-3">
      <template #message>
        项目由管理员在后台创建并分配成员。APP 端只有被加入的成员登录后才能看到项目，
        并且才能在项目下新增风机（事项）、拍照填报施工记录；未分配的账号登录后看不到任何项目。
      </template>
      <template #description>
        <span>
          当前共 {{ summary.projects }} 个项目、{{ summary.units }} 个风机/事项、{{
            summary.entries
          }}
          条施工记录，其中 {{ summary.pending }} 条待审核。
        </span>
      </template>
    </a-alert>

    <DynamicTable
      row-key="id"
      header-title="风电项目"
      :data-request="loadTableData"
      :columns="columns"
      :search="false"
      :fetch-config="{ listField: 'items' }"
      :scroll="{ x: 1500 }"
      bordered
      size="small"
    >
      <template #toolbar>
        <a-button
          type="primary"
          :disabled="!$auth('mobile:project')"
          @click="openProjectModal({})"
        >
          新建项目
        </a-button>
        <a-input-search
          v-model:value="keyword"
          allow-clear
          placeholder="搜索项目编号或名称"
          style="width: 220px"
          @search="reload"
        />
        <a-select
          v-model:value="status"
          allow-clear
          placeholder="项目状态"
          style="width: 120px"
          :options="statusOptions"
          @change="reload"
        />
        <a-button @click="reload">刷新</a-button>
      </template>
    </DynamicTable>

    <MembersDrawer v-model:open="memberOpen" :project="current" @changed="reload" />
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { message } from 'ant-design-vue';
  import { useTable } from '@/components/core/dynamic-table';
  import type { LoadDataParams } from '@/components/core/dynamic-table';
  import { useFormModal } from '@/hooks/useModal/';
  import Api from '@/api/';
  import type { WindProject, WindProjectStats } from '@/api/backend/api/windProject';
  import { baseColumns, statusText, type TableColumnItem, type TableListItem } from './columns';
  import { projectEditSchemas, projectSchemas } from './formSchemas';
  import MembersDrawer from './components/members-drawer.vue';

  defineOptions({ name: 'WindProjects' });

  const [DynamicTable, dynamicTableInstance] = useTable();
  const [showModal] = useFormModal();

  const keyword = ref('');
  const status = ref<string>();
  const stats = ref<WindProjectStats[]>([]);
  const memberOpen = ref(false);
  const current = ref<WindProject | null>(null);

  const statusOptions = Object.entries(statusText).map(([value, label]) => ({ value, label }));

  const summary = computed(() => ({
    projects: stats.value.length,
    units: stats.value.reduce((sum, item) => sum + (item.unitTotal || 0), 0),
    entries: stats.value.reduce((sum, item) => sum + (item.entryTotal || 0), 0),
    pending: stats.value.reduce((sum, item) => sum + (item.entryPending || 0), 0),
  }));

  const reload = () => dynamicTableInstance?.reload();

  const loadTableData = async (params: LoadDataParams) => {
    const list = await Api.windProject.projectList({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
      keyword: keyword.value || undefined,
      status: status.value || undefined,
    });
    // 汇总只用于展示风机/记录数：统计接口异常不能连带把项目列表和新建流程一起打断
    try {
      stats.value = await Api.windProject.projectOverview();
    } catch {
      /* 保留上一次统计，列表照常显示 */
    }
    const map = new Map(stats.value.map((item) => [item.id, item]));
    const items = (list.items || []).map((item) => {
      const stat = map.get(item.id);
      return {
        ...item,
        unitTotal: stat?.unitTotal ?? 0,
        unitDone: stat?.unitDone ?? 0,
        entryTotal: stat?.entryTotal ?? 0,
        entryPending: stat?.entryPending ?? 0,
        attachmentTotal: stat?.attachmentTotal ?? 0,
        progress: stat?.progress ?? 0,
      } as TableListItem;
    });
    return { items, meta: { totalItems: list.total || 0 } };
  };

  /** 清掉空字符串/空值，避免后端日期正则把「留空」判成格式错误 */
  const clean = (values: Record<string, any>) =>
    Object.fromEntries(
      Object.entries(values || {}).filter(([, value]) => value !== '' && value !== null && value !== undefined),
    );

  /** 新建 / 编辑项目 */
  const openProjectModal = async (record: Partial<TableListItem> = {}) => {
    const isUpdate = Boolean(record.id);
    const [formRef] = await showModal({
      modalProps: {
        title: isUpdate ? `编辑项目 · ${record.name}` : '新建项目',
        width: 720,
        onFinish: async (values) => {
          if (isUpdate) {
            await Api.windProject.projectUpdate(record.id!, clean(values));
          } else {
            const created = await Api.windProject.projectCreate(clean(values));
            // 新建后立刻打开成员配置：只有分配了成员，APP 端才有人能看到这个项目
            current.value = created;
            memberOpen.value = true;
          }
          reload();
        },
      },
      formProps: {
        labelWidth: 90,
        schemas: isUpdate ? projectEditSchemas : projectSchemas,
        autoSubmitOnEnter: true,
      },
    });

    if (isUpdate) {
      formRef?.setFieldsValue({
        name: record.name,
        location: record.location,
        capacityMw: record.capacityMw ?? undefined,
        startDate: record.startDate,
        endDate: record.endDate,
        status: record.status,
        remark: record.remark,
      });
      formRef?.updateSchema([{ field: 'code', componentProps: { disabled: true } }]);
    }
  };

  /** 打开成员抽屉 */
  const openMembers = (record: TableListItem) => {
    current.value = record;
    memberOpen.value = true;
  };

  const columns: TableColumnItem[] = [
    ...baseColumns,
    {
      title: '操作',
      dataIndex: 'ACTION',
      width: 190,
      fixed: 'right',
      actions: ({ record }) => [
        {
          label: '成员',
          type: 'link',
          auth: 'mobile:project',
          onClick: () => openMembers(record as TableListItem),
        },
        {
          label: '编辑',
          type: 'link',
          auth: 'mobile:project',
          onClick: () => openProjectModal(record as TableListItem),
        },
      ],
    },
  ];

  onMounted(() => {
    if (!Api.windProject) message.warning('项目管理接口未注册');
  });
</script>
