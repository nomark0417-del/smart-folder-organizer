import type { FileItem, Category } from '../types';
import { classifyFile } from './classifier';
import { sanitizeFolderName } from './format';

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export async function selectAndScanDirectory(
  categories: Category[],
  onProgress?: (count: number) => void
): Promise<{ dirHandle: FileSystemDirectoryHandle; dirName: string; files: FileItem[] }> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('이 브라우저는 File System Access API를 지원하지 않습니다. Chrome, Edge, Whale 브라우저를 사용해 주세요.');
  }

  const dirHandle = await (window as any).showDirectoryPicker({
    mode: 'readwrite',
  });

  const files: FileItem[] = [];
  let count = 0;

  for await (const entry of (dirHandle as any).values()) {
    if (entry.kind === 'file') {
      try {
        const file = await entry.getFile();
        const ext = file.name.includes('.') ? `.${file.name.split('.').pop()!.toLowerCase()}` : '';

        const match = classifyFile({ name: file.name, extension: ext }, categories);

        files.push({
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          extension: ext,
          size: file.size,
          lastModified: file.lastModified,
          handle: entry as FileSystemFileHandle,
          assignedCategoryId: match.categoryId,
          suggestedCategoryId: match.categoryId,
          matchReason: match.reason,
          isManual: false,
          status: 'pending',
        });

        count++;
        if (onProgress) onProgress(count);
      } catch (e) {
        console.warn('Failed to read file entry:', entry.name, e);
      }
    }
  }

  return {
    dirHandle,
    dirName: dirHandle.name,
    files,
  };
}

async function getUniqueFileName(destDirHandle: any, originalName: string): Promise<string> {
  const dotIndex = originalName.lastIndexOf('.');
  const baseName = dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
  const ext = dotIndex !== -1 ? originalName.slice(dotIndex) : '';

  let candidate = originalName;
  let counter = 1;

  while (true) {
    try {
      await destDirHandle.getFileHandle(candidate);
      candidate = `${baseName}_(${counter})${ext}`;
      counter++;
    } catch (e: any) {
      if (e.name === 'NotFoundError') {
        return candidate;
      }
      throw e;
    }
  }
}

export function createFileItemsFromFiles(
  rawFiles: File[] | FileList,
  categories: Category[]
): FileItem[] {
  const items: FileItem[] = [];
  const fileArray = Array.from(rawFiles);

  for (const file of fileArray) {
    const ext = file.name.includes('.') ? `.${file.name.split('.').pop()!.toLowerCase()}` : '';
    const match = classifyFile({ name: file.name, extension: ext }, categories);

    items.push({
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      extension: ext,
      size: file.size,
      lastModified: file.lastModified,
      rawFile: file,
      assignedCategoryId: match.categoryId,
      suggestedCategoryId: match.categoryId,
      matchReason: match.reason,
      isManual: false,
      status: 'pending',
    });
  }

  return items;
}

export async function executeFileOrganization(
  rootDirHandle: FileSystemDirectoryHandle | null,
  files: FileItem[],
  categories: Category[],
  onProgress?: (current: number, total: number, fileName: string, status: 'moving' | 'moved' | 'error') => void
): Promise<{
  successCount: number;
  failCount: number;
  movedFileIds: string[];
  errors: { fileName: string; error: string }[];
}> {
  let successCount = 0;
  let failCount = 0;
  const movedFileIds: string[] = [];
  const errors: { fileName: string; error: string }[] = [];

  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    categoryMap.set(cat.id, sanitizeFolderName(cat.name) || '기타_미분류');
  }
  categoryMap.set('uncategorized', '기타_미분류');

  const createdDirHandles = new Map<string, any>();

  for (let i = 0; i < files.length; i++) {
    const item = files[i];
    const catName = categoryMap.get(item.assignedCategoryId) || '기타_미분류';

    if (onProgress) {
      onProgress(i + 1, files.length, item.name, 'moving');
    }

    try {
      // 대상 폴더 핸들이 없거나 가상 데모 파일인 경우 시뮬레이션
      if (!rootDirHandle || (!item.handle && !item.rawFile)) {
        await new Promise(resolve => setTimeout(resolve, 90));
        successCount++;
        movedFileIds.push(item.id);
        if (onProgress) {
          onProgress(i + 1, files.length, item.name, 'moved');
        }
        continue;
      }

      // 1. 대상 카테고리 폴더 핸들 가져오기/생성
      let destDirHandle = createdDirHandles.get(catName);
      if (!destDirHandle) {
        destDirHandle = await (rootDirHandle as any).getDirectoryHandle(catName, { create: true });
        createdDirHandles.set(catName, destDirHandle);
      }

      // 2. 파일명 충돌 방지 고유 이름 생성
      const finalName = await getUniqueFileName(destDirHandle, item.name);

      // 3. 파일 이동/저장 실행
      if (item.handle && typeof (item.handle as any).move === 'function') {
        await (item.handle as any).move(destDirHandle, finalName);
      } else {
        const srcBuffer = item.rawFile
          ? await item.rawFile.arrayBuffer()
          : await (await item.handle!.getFile()).arrayBuffer();

        const newFileHandle = await destDirHandle.getFileHandle(finalName, { create: true });
        const writable = await newFileHandle.createWritable();
        await writable.write(srcBuffer);
        await writable.close();

        // 원본 폴더에서 읽은 실제 핸들 파일인 경우 기존 위치에서 삭제
        if (item.handle) {
          try {
            await (rootDirHandle as any).removeEntry(item.name);
          } catch (e) {
            console.warn('Could not remove original entry:', item.name, e);
          }
        }
      }

      successCount++;
      movedFileIds.push(item.id);
      if (onProgress) {
        onProgress(i + 1, files.length, item.name, 'moved');
      }
    } catch (err: any) {
      failCount++;
      errors.push({ fileName: item.name, error: err?.message || '알 수 없는 오류' });
      if (onProgress) {
        onProgress(i + 1, files.length, item.name, 'error');
      }
    }
  }

  return { successCount, failCount, movedFileIds, errors };
}
