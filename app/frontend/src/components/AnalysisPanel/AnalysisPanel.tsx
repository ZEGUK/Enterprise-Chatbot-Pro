import { Stack, Pivot, PivotItem } from "@fluentui/react";
import SyntaxHighlighter from "react-syntax-highlighter";

import styles from "./AnalysisPanel.module.css";

import { SupportingContent } from "../SupportingContent";
import { ChatAppResponse } from "../../api";
import { AnalysisPanelTabs } from "./AnalysisPanelTabs";
import { ThoughtProcess } from "./ThoughtProcess";

interface Props {
    className: string;
    activeTab: AnalysisPanelTabs;
    onActiveTabChanged: (tab: AnalysisPanelTabs) => void;
    activeCitation: string | undefined;
    citationHeight: string;
    answer: ChatAppResponse;
}

const pivotItemDisabledStyle = { disabled: true, style: { color: "grey" } };

export const AnalysisPanel = ({ answer, activeTab, activeCitation, citationHeight, className, onActiveTabChanged }: Props) => {
    const isDisabledThoughtProcessTab: boolean = !answer.choices[0].context.thoughts;
    const isDisabledSupportingContentTab: boolean = !answer.choices[0].context.data_points;
    const isDisabledCitationTab: boolean = !activeCitation;

    return (
        <Pivot
            className={className}
            selectedKey={activeTab}
            onLinkClick={pivotItem => pivotItem && onActiveTabChanged(pivotItem.props.itemKey! as AnalysisPanelTabs)}
        >
            <PivotItem
                itemKey={AnalysisPanelTabs.ThoughtProcessTab}
                headerText="思考过程"
                headerButtonProps={isDisabledThoughtProcessTab ? pivotItemDisabledStyle : undefined}
            >
                <ThoughtProcess thoughts={answer.choices[0].context.thoughts || []} />
            </PivotItem>
            <PivotItem
                itemKey={AnalysisPanelTabs.SupportingContentTab}
                headerText="数据来源"
                headerButtonProps={isDisabledSupportingContentTab ? pivotItemDisabledStyle : undefined}
            >
                <SupportingContent supportingContent={answer.choices[0].context.data_points} />
            </PivotItem>
            <PivotItem itemKey={AnalysisPanelTabs.CitationTab} headerText="引用" headerButtonProps={isDisabledCitationTab ? pivotItemDisabledStyle : undefined}>
                {activeCitation?.endsWith(".png") ? (
                    <img src={activeCitation} className={styles.citationImg} />
                ) : (
                    <iframe title="引用" src={activeCitation} width="100%" height={citationHeight} />
                )}
            </PivotItem>
        </Pivot>
    );
};
