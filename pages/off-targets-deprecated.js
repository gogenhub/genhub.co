import React from "react";
import fetch from "isomorphic-unfetch";
import Error from "next/error";
import css from "styled-jsx/css";

import Page from "../components/Page";
import WithState from "../components/WithState";
import Text from "../components/Text";
import Table from "../components/Table";
import Alert from "../components/Alert";
import ExternalLink from "../components/ExternalLink";
import { groupElements, format } from "../utils";

const OffTargets = ({ status = 0, data = {}, species = "", seq = "", strand = "" }) => {
	if (status) {
		return <Error statusCode={status} />;
	}
	return (
		<Page title={"Off-targets - GenHub"} render={(setError) => (
			<WithState initialState={{ data: null }} onStart={async ({ setState }) => {
				const slices = data.offTargets.map(item => `${item.chr}:${item.index - 2}..${item.index + 27}:${strand}`);
				const res = await fetch(`https://rest.ensembl.org/sequence/region/${species}`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({ regions: slices })
				});

				if (!res.ok) {
					return setError("Failed to fetch the data.");
				}
				const objs = await res.json();
				const seqs = objs.map(obj => obj.seq);

				const newData = {
					...data,
					offTargets: data.offTargets.map((item, i) => ({
						sequence: seqs[i],
						...item
					}))
				};
				setState({ data: newData });
			}} render={({ state }) => (
				<>
					<div className="beta-alert-container">
						<Alert><Text>The app is currently in beta! Give us <ExternalLink to="https://forms.gle/MmTHWiy4zzsv5s8N9">
						feedback
						</ExternalLink>.</Text></Alert>
					</div>
					<div className="off-targets-header">
						<Text desc>Off-targets for: </Text>
						<Text warning>{seq.substring(0, 3)}</Text>
						<Text>{seq.substring(3)}</Text>
						<Text desc> - Species: </Text><Text>{species} </Text>
						<Text desc> - Strand: </Text><Text>{strand}</Text>
					</div>
					{
						state.data &&
						<div className="off-targets-results">
							<div className="off-targets-count">
								<Text desc>Count: </Text><Text>{state.data.count.join(" - ")}</Text>
							</div>
							<div className="off-targets-table">
								<Table headers={[{
									key: "sequence",
									display: "Sequence"
								}, {
									key: "index",
									display: "Position"
								}, {
									key: "chr",
									display: "Chromosome"
								}, {
									key: "score",
									display: "Score"
								}]} weights={[3, 1, 1, 1]} items={state.data.offTargets} renderRowItem={(header, item) => {
									const tableRowMap = {
										sequence: () => {
											const offTargetSeq = item.sequence;
											const preffix = offTargetSeq.substring(0, 3);

											const pam = offTargetSeq.substring(3, 6);
											const targetPam = seq.substring(0, 3);
											const pamGroups = groupElements(pam, targetPam);

											const offTarget = offTargetSeq.substring(6, 26);
											const target = seq.substring(3, 23);
											const targetGroups = groupElements(offTarget, target);

											const suffix = offTargetSeq.substring(26, 30);
											return (
												<div className="table-sequence">
													<Text desc>{preffix}</Text>
													{pamGroups.map(({ val, range }, i) =>
														val ?
															<Text key={`key-${i}`} warning>{pam.substring(range[0], range[1])}</Text> :
															<Text key={`key-${i}`} warning outlineError>{pam.substring(range[0], range[1])}</Text>
													)}
													{targetGroups.map(({ val, range }, i) =>
														val ?
															<Text key={`key-${i}`}>{offTarget.substring(range[0], range[1])}</Text> :
															<Text key={`key-${i}`} outlineError>{offTarget.substring(range[0], range[1])}</Text>
													)}
													<Text desc>{suffix}</Text>
												</div>
											);
										},
										index: () => <Text>{format(item.index)}</Text>,
										chr: () => <Text>{item.chr}</Text>,
										score: () => <Text>{item.score.toFixed(2)}</Text>
									};
									return tableRowMap[header]();
								}}/>
							</div>
						</div>
					}
					<style jsx>{styles}</style>
				</>
			)} />
		)} />
	);
};

OffTargets.getInitialProps = async ({ query }) => {
	const { species, seq, strand } = query;
	const res = await fetch(`${process.env.FUNCTIONS}/${species}-off-targets?seq=${seq}`);
	if (!res.ok) {
		return { status: res.status };
	}
	const data = await res.json();

	return {
		data,
		species,
		seq,
		strand
	};
};

const styles = css`
.beta-alert-container {
	box-sizing: border-box;
	padding: 50px 60px 30px 60px;
}

.off-targets-header {
	box-sizing: border-box;
	padding: 0 65px 10px 65px;
}

.off-targets-count {
	box-sizing: border-box;
	padding: 0 65px 10px 65px;
}

.off-targets-table {
	box-sizing: border-box;
	padding: 0 60px 20px 60px;
}
`;

export default OffTargets;