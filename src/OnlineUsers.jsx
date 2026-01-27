import { useCall } from "./Context";

export default function OnlineUsers() {
  const { onlineUsers, myId } = useCall();

  return (
    <div className="online-users">
      <h4>Online</h4>

      {onlineUsers
        .filter((id) => id !== myId)
        .map((id) => (
          <div key={id} className="user-row">
            <span className="green-dot"></span>
            <span className="user-id">{id}</span>
          </div>
        ))}
    </div>
  );
}
