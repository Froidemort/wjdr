import pytest

from wjdr.models import CampaignTable, ChapterTable, ScenarioTable


@pytest.fixture(scope="session")
def campaign(session_fixture):
    campaign = CampaignTable(name="Test Campaign", description="A test campaign", gm_name="Test GM")
    session_fixture.add(campaign)
    session_fixture.commit()
    yield campaign

@pytest.fixture(scope="session")
def scenario(session_fixture, campaign):
    scenario = ScenarioTable(name="Test Scenario", description="A test scenario", campaign_id=campaign.id)
    session_fixture.add(scenario)
    session_fixture.commit()
    yield scenario

@pytest.fixture(scope="session")
def chapter(session_fixture, scenario):
    chapter = ChapterTable(name="Test Chapter", description="A test chapter", scenario_id=scenario.id)
    session_fixture.add(chapter)
    session_fixture.commit()
    yield chapter

@pytest.mark.unitary
def test_campaign(campaign):
    assert campaign.id is not None
    assert campaign.name == "Test Campaign"
    assert campaign.description == "A test campaign"
    assert campaign.gm_name == "Test GM"

@pytest.mark.unitary
def test_scenario(scenario, campaign):
    assert scenario.id is not None
    assert scenario.name == "Test Scenario"
    assert scenario.description == "A test scenario"
    assert scenario.campaign_id == campaign.id

@pytest.mark.unitary
def test_chapter(chapter, scenario):
    assert chapter.id is not None
    assert chapter.name == "Test Chapter"
    assert chapter.description == "A test chapter"
    assert chapter.scenario_id == scenario.id

@pytest.mark.unitary
def test_campaign_scenarios(campaign, scenario):
    campaign.scenarios.append(scenario)
    assert scenario in campaign.scenarios
    assert campaign.scenarios[0].name == "Test Scenario"

@pytest.mark.unitary
def test_scenario_chapters(scenario, chapter):
    scenario.chapters.append(chapter)
    assert chapter in scenario.chapters
    assert scenario.chapters[0].name == "Test Chapter"
