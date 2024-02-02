const { initializeMailgunClient } = require("../util/initializeClient");

const getAllMembers = async (req, res, mailingList) => {
  // Initalize params for pagination
  let members = [];
  let emailSet = new Set();
  let count = [];
  const params = {
    limit: 1000,
    skip: 0,
  };

  const client = initializeMailgunClient(req.session.apiKey);

  // Get count of members from mailing list
  const { members_count } = await client.lists
    .get(mailingList)
    .then((data) => data)
    .catch((err) => {
      console.log(err);
      res.status(400).send({ error: err });
    });

  // Get initial list of members
  const initialMemberQuery = await client.lists.members.listMembers(
    mailingList,
    {
      limit: 1000, // Maximum value for mailgun pagination
    }
  );
  members = [...initialMemberQuery.items];
  count += members.length;

  // Calculate the number of pages.
  const numPages = Math.ceil(members_count / params.limit);

  // Update initial pagination params
  params.page = initialMemberQuery.pages.next.page;

  for (let page = 1; page <= numPages; page++) {
    let memberDetails = await client.lists.members.listMembers(
      mailingList,
      params
    );

    // Update pagination params
    params.page = memberDetails.pages.next.page;

    // Check for duplicates and skip them
    let currentMembers = memberDetails.items;
    for (let member of currentMembers) {
      if (emailSet.has(member.address)) {
        continue;
      } else {
        emailSet.add(member.address);
        members.push(member);
      }
    }
    console.log(
      `Page: ${page} \n Members: ${currentMembers.length} Page: ${params.page}`
    );
    console.log(members.length);
  }
  return members;
};

/**
 * Returns paginated list of members
 * @param {Request} req
 * @param {Response} res
 * @param {string} mailingList
 * @returns
 */
const getMembers = async (req, res, mailingList) => {
  const client = initializeMailgunClient(req.session.apiKey);
  try {
    const members = await client.lists.members.listMembers(mailingList);
    return members;
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: error });
  }
};

const addMembers = async (mailingList, members, client, res) => {
  console.log(members);
  try {
    const result = await client.lists.members.createMembers(mailingList, {
      members: members,
      upsert: "yes",
    });
    console.log(result);
    return result;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const updateMember = async (req, res) => {
  const client = initializeMailgunClient(req.session.apiKey);
  // Attempt to update member
  try {
    const updatedMember = await client.lists.members.updateMember(
      req.body.mailing_list,
      req.body.member_address,
      req.body.update_fields
    );
    return updatedMember;
  } catch (error) {
    res.status(400).send({ status: "Error", error: error });
  }
};
module.exports = { getMembers, addMembers, updateMember, getAllMembers };
