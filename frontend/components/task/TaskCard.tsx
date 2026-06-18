import Link from "next/link";
import { Task } from "@/lib/types";
import { StatusBadge, TaskTypeBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeDate, formatCurrency, truncateText } from "@/lib/utils";
import { Clock, User, DollarSign, MessageSquare } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const hasImage = task.images.length > 0;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="block"
      onClick={handleClick}
    >
      <div className="bg-white rounded-lg shadow-card border border-gray-200 hover:shadow-card-hover transition-shadow cursor-pointer overflow-hidden">
        {hasImage && (
          <div className="h-32 bg-gray-100 relative overflow-hidden">
            <img
              src={task.images[0].url}
              alt={task.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2">
              <TaskTypeBadge type={task.type} />
            </div>
          </div>
        )}

        <div className="p-4">
          {!hasImage && (
            <div className="mb-2">
              <TaskTypeBadge type={task.type} />
            </div>
          )}

          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
            {task.title}
          </h3>

          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
            {truncateText(task.description, 60)}
          </p>

          <div className="flex items-center justify-between mb-3">
            <StatusBadge status={task.status} />
            {task.amount !== undefined && (
              <span className="text-sm font-semibold text-primary-600">
                {formatCurrency(task.amount)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              <span>{task.project.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatRelativeDate(task.createdAt)}</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <div className="flex -space-x-2">
              {task.assignees.slice(0, 3).map((assignee) => (
                <Avatar
                  key={assignee.id}
                  src={assignee.avatar}
                  fallback={assignee.name}
                  size="sm"
                  className="border-2 border-white"
                />
              ))}
              {task.assignees.length > 3 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 border-2 border-white">
                  +{task.assignees.length - 3}
                </div>
              )}
            </div>
            {task.chatMessages.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{task.chatMessages.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
