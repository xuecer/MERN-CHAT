import { useEffect, useState, useCallback, memo } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";

// 提取 SidebarItem 组件并使用 memo 优化
const SidebarItem = memo(({ user, isSelected, isOnline, onClick }) => (
  <button
    onClick={() => onClick(user)}
    className={`
      w-full p-3 flex items-center gap-3
      hover:bg-base-300 transition-colors
      ${isSelected ? "bg-base-300 ring-1 ring-base-300" : ""}
    `}
  >
    <div className="relative mx-auto lg:mx-0">
      <img
        src={user.profilePic || "/avatar.png"}
        alt={user.name}
        className="size-12 object-cover rounded-full"
      />
      {isOnline && (
        <span
          className="absolute bottom-0 right-0 size-3 bg-green-500 
          rounded-full ring-2 ring-zinc-900"
        />
      )}
    </div>

    {/* User info - only visible on larger screens */}
    <div className="hidden lg:block text-left min-w-0">
      <div className="font-medium truncate">{user.fullName}</div>
      <div className="text-sm text-zinc-400">{isOnline ? "在线" : "离线"}</div>
    </div>
  </button>
));

SidebarItem.displayName = "SidebarItem";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } =
    useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aOnline = onlineUsers.includes(a._id);
    const bOnline = onlineUsers.includes(b._id);
    if (aOnline && !bOnline) return -1;
    if (!aOnline && bOnline) return 1;
    return 0;
  });

  // 使用 useCallback 缓存点击处理函数
  const handleUserClick = useCallback(
    (user) => {
      setSelectedUser(user);
    },
    [setSelectedUser]
  );

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">联系人</span>
        </div>
        {/* TODO: Online filter toggle */}
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              //不写checked会？
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">仅显示在线</span>
          </label>
          <span className="text-xs text-zinc-500">
            ({onlineUsers.length - 1} 在线)
          </span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {sortedUsers.map((user) => (
          <SidebarItem
            key={user._id}
            user={user}
            isSelected={selectedUser?._id === user._id}
            isOnline={onlineUsers.includes(user._id)}
            onClick={handleUserClick}
          />
        ))}

        {sortedUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">暂无在线用户</div>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;
