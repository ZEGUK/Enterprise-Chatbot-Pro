import { useRef, useState, useEffect, useCallback } from "react";
import { PrimaryButton, Spinner } from "@fluentui/react";
import { useDropzone } from "react-dropzone";
import styles from "./Upload.module.css";
import { UploadFileRequest, UploadFileResponse } from "../../api/models";
import { uploadApi } from "../../api/api";

const FileUploader: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [uploadStatus, setUploadStatus] = useState<UploadFileResponse[]>([]);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(acceptedFiles);
    }, []);

    const renderFiles = () => {
        return files.map((file, index) => <li key={index}>{file.name}</li>);
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            return;
        }

        setIsUploading(true);

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append("file", files[i]);
        }

        try {
            const request: UploadFileRequest = { formData };
            console.log(request.formData);
            const response = await uploadApi(request);
            const responseData = await response;
            setUploadStatus(prevStatus => [...prevStatus, responseData]);
            setIsUploading(false);
            setFiles([]);
            console.log(responseData);
        } catch (error: unknown) {
            if (error instanceof Error) {
                const e: Error = error;
                setUploadStatus(prevStatus => [...prevStatus, { success: false, message: e.message }]);
                alert("Upload failed!");
            }
            setIsUploading(false);
            setUploadStatus(prevStatus => [...prevStatus, { success: false, message: "Unknown error" }]);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone();

    return (
        <div className={styles.uploadContainer}>
            <div className={styles.uploadTopSection}>
                <h2 className={styles.uploadTitle}>添加你的数据</h2>
            </div>
            <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.active : ""}`}>
                <input type="file" {...getInputProps()} />
                {isUploading ? <p>上传文件中...</p> : <p>拖动文件至此或者点击选择文件</p>}
                {files.length > 0 && <ul>{renderFiles()}</ul>}
            </div>
            <div className={styles.oneshotBottomSection}></div>
            <PrimaryButton className={styles.primaryButton} text="上传" onClick={handleUpload} disabled={isUploading} />
        </div>
    );
};

export default FileUploader;
