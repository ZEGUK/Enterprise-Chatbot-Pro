import { Example } from "./Example";

import styles from "./Example.module.css";

const DEFAULT_EXAMPLES: string[] = ["根据服务能力异常程度，网络和信息系统服务能力异常分为哪几类？", "网络安全事件分为哪几类？", "特别重大异常是什么？"];

const GPT4V_EXAMPLES: string[] = ["根据服务能力异常程度，网络和信息系统服务能力异常分为哪几类？", "网络安全事件分为哪几类？", "特别重大异常是什么？"];

interface Props {
    onExampleClicked: (value: string) => void;
    useGPT4V?: boolean;
}

export const ExampleList = ({ onExampleClicked, useGPT4V }: Props) => {
    return (
        <ul className={styles.examplesNavList}>
            {(useGPT4V ? GPT4V_EXAMPLES : DEFAULT_EXAMPLES).map((question, i) => (
                <li key={i}>
                    <Example text={question} value={question} onClick={onExampleClicked} />
                </li>
            ))}
        </ul>
    );
};
