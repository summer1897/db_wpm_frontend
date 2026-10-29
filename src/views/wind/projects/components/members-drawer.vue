<template>
  <a-drawer
    :open="open"
    :width="680"
    :title="project ? `${project.name} · 项目成员` : '项目成员'"
    destroy-on-close
    @close="close"
  >
    <a-alert type="info" show-icon class="mb-4">
      <template #message>
        只有这里分配过的账号，登录 APP 后才能看到此项目，并才能在项目下新增风机（事项）、拍照填报。
        未被分配的账号登录后项目列表为空。
      </template>
    </a-alert>

    <a-form layout="inline" class="mb-4">
      <a-form-item label="添加成员">
        <a-select
          v-model:value="picked"
          show-search
          allow-clear
          :filter-option="false"
          :options="options"
          :loading="searching"
          placeholder="输入姓名或账号搜索"
          style="width: 260px"
          @search="onSearch"
        >
          <template #option="{ label, joined }">
            <span>{{ label }}</span>
            <a-tag v-if="joined" color="green" class="ml-2">已加入</a-tag>
          </template>
        </a-select>
      </a-form-item>
      <a-form-item label="角色">
        <a-select v-model:value="role" style="width: 150px" :options="roleOptions" />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" :loading="saving" :disabled="!picked" @click="addMember">
          添加 / 更新
        </a-button>
      </a-form-item>
    </a-form>

    <a-table
      :data-source="members"
      :columns="columns"
      :loading="loading"
      :pagination="false"
      row-key="id"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'role'">
          <a-select
            :value="record.role"
            size="small"
            style="width: 130px"
            :options="roleOptions"
            :disabled="record.role === 'owner'"
            @change="(value) => changeRole(record as WindMember, value as WindMemberRole)"
          />
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button
            v-if="record.role !== 'owner'"
            type="link"
            danger
            size="small"
            @click="remove(record as WindMember)"
          >
            移出
          </a-button>
          <span v-else class="text-gray-400">负责人不可移出</span>
        </template>
      </template>
    </a-table>

    <a-empty v-if="!loading && !members.length" description="还没有分配成员" />

    <div class="mt-4 text-gray-400 text-xs leading-6">
      <div>项目负责人：可审核、可分配成员、可改项目信息；</div>
      <div>管理员：可审核记录、维护风机与工序；记录员：只能新增风机与填报；只读：只能查看。</div>
    </div>
  </a-drawer>
</template>

<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';
  import { Modal, message } from 'ant-design-vue';
  import Api from '@/api/';
  import type { WindMember, WindMemberRole, WindProject } from '@/api/backend/api/windProject';

  const props = defineProps<{ open: boolean; project: WindProject | null }>();
  const emit = defineEmits<{ (e: 'update:open', value: boolean): void; (e: 'changed'): void }>();

  const roleOptions = [
    { label: '项目负责人', value: 'owner' },
    { label: '管理员', value: 'manager' },
    { label: '记录员', value: 'recorder' },
    { label: '只读', value: 'viewer' },
  ];
  const columns = [
    { title: '姓名', dataIndex: 'nickname', key: 'nickname', width: 120 },
    { title: '账号', dataIndex: 'username', key: 'username', width: 140 },
    { title: '角色', key: 'role', width: 150 },
    { title: '操作', key: 'action', width: 130 },
  ];

  const members = ref<WindMember[]>([]);
  const loading = ref(false);
  const saving = ref(false);
  const searching = ref(false);
  const picked = ref<number>();
  const role = ref<WindMemberRole>('recorder');
  const keyword = ref('');
  const candidates = ref<Awaited<ReturnType<typeof Api.windProject.projectUserOptions>>>([]);

  const options = computed(() =>
    candidates.value
      .filter((item) => !item.joined || item.id === picked.value)
      .map((item) => ({
        value: item.id,
        label: `${item.nickname || item.username}${item.deptName ? `（${item.deptName}）` : ''}`,
        joined: item.joined,
      })),
  );

  const close = () => emit('update:open', false);

  async function loadMembers() {
    if (!props.project) return;
    loading.value = true;
    try {
      members.value = await Api.windProject.projectMembers(props.project.id);
    } finally {
      loading.value = false;
    }
  }

  async function searchUsers(text = '') {
    if (!props.project) return;
    keyword.value = text;
    searching.value = true;
    try {
      // 只找启用账号；已加入的在选项里打标签，便于确认角色是否要给错人
      candidates.value = await Api.windProject.projectUserOptions({
        keyword: text || undefined,
        projectId: props.project.id,
      });
    } finally {
      searching.value = false;
    }
  }

  const onSearch = (text: string) => {
    void searchUsers(text);
  };

  async function addMember() {
    if (!props.project || !picked.value) return;
    saving.value = true;
    try {
      await Api.windProject.projectMemberUpsert(props.project.id, {
        userId: picked.value,
        role: role.value,
      });
      picked.value = undefined;
      await Promise.all([loadMembers(), searchUsers(keyword.value)]);
      emit('changed');
    } catch (error: any) {
      message.error(error?.message || '添加成员失败');
    } finally {
      saving.value = false;
    }
  }

  async function changeRole(record: WindMember, value: WindMemberRole) {
    if (!props.project) return;
    try {
      await Api.windProject.projectMemberUpsert(props.project.id, {
        userId: record.userId,
        role: value,
      });
      await loadMembers();
      emit('changed');
    } catch (error: any) {
      message.error(error?.message || '调整角色失败');
    }
  }

  function remove(record: WindMember) {
    const project = props.project;
    if (!project) return;
    Modal.confirm({
      title: `把「${record.nickname || record.username}」移出项目？`,
      content: '移出后该账号登录 APP 将看不到此项目，已上传的记录仍保留在台账中。',
      okText: '移出',
      okType: 'danger',
      onOk: async () => {
        await Api.windProject.projectMemberRemove(project.id, record.userId);
        await Promise.all([loadMembers(), searchUsers(keyword.value)]);
        emit('changed');
      },
    });
  }

  watch(
    () => [props.open, props.project?.id],
    ([open]) => {
      if (open) {
        picked.value = undefined;
        role.value = 'recorder';
        void loadMembers();
        void searchUsers('');
      }
    },
    { immediate: true },
  );
</script>
