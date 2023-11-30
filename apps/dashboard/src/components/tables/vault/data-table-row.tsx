"use client";

import { createFolderAction } from "@/actions/create-folder-action";
import { deleteFileAction } from "@/actions/delete-file-action";
import { shareFileAction } from "@/actions/share-file-action";
import { FileIcon } from "@/components/file-icon";
import { useI18n } from "@/locales/client";
import { formatSize } from "@/utils/format";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@midday/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@midday/ui/context-menu";
import { TableCell, TableRow } from "@midday/ui/table";
import { useToast } from "@midday/ui/use-toast";
import { format } from "date-fns";
import { useAction } from "next-safe-action/hook";
import { useParams, usePathname, useRouter } from "next/navigation";

export const translatedFolderName = (t: any, folder: string) => {
  switch (folder) {
    case "all":
      return t("folders.all");
    case "inbox":
      return t("folders.inbox");
    case "transactions":
      return t("folders.transactions");
    case "exports":
      return t("folders.exports");

    default:
      return folder;
  }
};

const ONE_WEEK_IN_SECONDS = 604800;
const ONE_MONTH_IN_SECONDS = 2629743;
const ONE_YEAR_IN_SECONDS = ONE_MONTH_IN_SECONDS * 12;

export function DataTableRow({ data }) {
  const t = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const folders = params?.folders ?? [];
  const isDefaultFolder = ["inbox", "exports", "transactions"].includes(
    data.name
  );
  const disableActions = ["transactions"].includes(folders?.at(0));
  const folderPath = folders.join("/");
  const filepath = [...folders, data.name].join("/");

  const deleteFile = useAction(deleteFileAction, {
    onSuccess: () => {
      setTimeout(() => {
        toast({
          duration: 4000,
          description: "Successfully deleted file",
        });
      }, 100);
    },
  });

  const shareFile = useAction(shareFileAction, {
    onSuccess: async (url) => {
      try {
        await navigator.clipboard.writeText(url);

        toast({
          duration: 4000,
          description: `Copied URL for ${data.name} to clipboard.`,
        });
      } catch (err) {}
    },
  });

  const createFolder = useAction(createFolderAction, {
    onError: (katt) => {
      console.log(katt);

      toast({
        duration: 4000,
        description:
          "The folder already exists in the current directory. Please use a different name.",
      });
    },
  });

  const handleNavigate = () => {
    if (data.isFolder) {
      router.push(`${pathname}/${data.name}`);
    }
  };

  return (
    <AlertDialog>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <TableRow
            className="h-[45px] cursor-default"
            onClick={handleNavigate}
          >
            <TableCell>
              <div className="flex items-center space-x-2">
                <FileIcon
                  mimetype={data?.metadata?.mimetype}
                  name={data.name}
                  isFolder={data.isFolder}
                />
                <span>{translatedFolderName(t, data.name)}</span>
                {data?.metadata?.size && (
                  <span className="text-[#878787]">
                    {formatSize(data.metadata.size)}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              {data?.created_at ? format(new Date(data.created_at), "Pp") : "-"}
            </TableCell>
            <TableCell>
              {data?.updated_at ? format(new Date(data.updated_at), "Pp") : "-"}
            </TableCell>
          </TableRow>
        </ContextMenuTrigger>

        <ContextMenuContent>
          {!data.isFolder && (
            <ContextMenuSub>
              <ContextMenuSubTrigger>Share URL</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem
                  onClick={() =>
                    shareFile.execute({
                      filepath,
                      expireIn: ONE_WEEK_IN_SECONDS,
                    })
                  }
                >
                  Expire in 1 week
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() =>
                    shareFile.execute({
                      filepath,
                      expireIn: ONE_MONTH_IN_SECONDS,
                    })
                  }
                >
                  Expire in 1 month
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() =>
                    shareFile.execute({
                      filepath,
                      expireIn: ONE_YEAR_IN_SECONDS,
                    })
                  }
                >
                  Expire in 1 year
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}
          <ContextMenuItem
            onClick={() =>
              createFolder.execute({
                path: folderPath,
                name: "Untitled folder",
              })
            }
          >
            Create folder
          </ContextMenuItem>
          {!disableActions && !isDefaultFolder && (
            <ContextMenuItem>Rename</ContextMenuItem>
          )}
          <ContextMenuItem>
            <a
              href={`/api/download/file?path=${folderPath}&filename=${data.name}`}
              download
              className="truncate"
            >
              Download
            </a>
          </ContextMenuItem>
          {!disableActions && !isDefaultFolder && (
            <AlertDialogTrigger asChild>
              <ContextMenuItem>Delete</ContextMenuItem>
            </AlertDialogTrigger>
          )}
        </ContextMenuContent>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteFile.execute({
                  path: data.isFile ? folderPath : filepath,
                  isFolder: data.isFolder,
                })
              }
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </ContextMenu>
    </AlertDialog>
  );
}